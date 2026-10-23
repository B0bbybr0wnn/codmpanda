// ============================================
// CODMPanda Notification Worker
// Uses FIREBASE_SERVICE_ACCOUNT_JSON secret
// Handles: FCM push + daily cron
// ============================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/health') {
      return json({
        status: 'ok',
        service: 'codmpanda-notify',
        build: 'codmpanda-coach-briefings-v5',
        coachRouteConfigured: true,\n        coachRootCompatibility: true,\n        briefingDiscovery: 'official-html+sitemaps',
        serviceAccountConfigured: !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
        aiConfigured: !!env.GEMINI_API_KEY,
        routes: ['GET /health', 'GET /briefings', 'POST /coach', 'POST /send'],
        geminiModel: String(env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '')
      });
    }

    if (path === '/briefings' && request.method === 'GET') {
      try {
        const rawBriefings = await fetchOfficialBriefings();
        const briefings = await summarizeOfficialBriefings(rawBriefings, env);
        return json({
          success: briefings.some(item => item.isArticle && item.articleText && item.articleText.length >= 120 && item.aiSummary),
          aiConfigured: !!env.GEMINI_API_KEY,
          updatedAt: new Date().toISOString(),
          briefings: briefings.filter(item => item.isArticle && item.articleText && item.articleText.length >= 120).map(({ articleText, isArticle, ...item }) => item)
        });
      } catch (error) {
        console.error('[briefings] Failed:', error);
        return json({ success: false, error: 'Could not load official CODM briefings.' }, 502);
      }
    }

    if ((path === '/coach' || path === '/') && request.method === 'POST') {
      // Older frontend builds accidentally posted Coach messages to the Worker root,
      // where the push-notification handler returned "No tokens provided". Detect that
      // payload safely and route it to Coach without changing notification requests.
      const coachRequest = path === '/coach' || await request.clone().json()
        .then(body => typeof body?.message === 'string' && body.message.trim().length > 0)
        .catch(() => false);
      if (coachRequest) return handleCoach(request, env);
    }

    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405);
    }

    try {
      const body = await request.json();
      const { tokens, title, body: msgBody, data } = body;

      if (!tokens || !tokens.length) {
        return json({ error: 'No tokens provided' }, 400);
      }

      let sa;
      try {
        sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (e) {
        return json({ error: 'Service account env not set or invalid JSON' }, 500);
      }

      const accessToken = await getAccessToken(sa);
      if (!accessToken) {
        return json({ error: 'Failed to get access token' }, 500);
      }

      const projectId = sa.project_id;
      const fcmUrl = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';

      const results = [];
      for (const token of tokens) {
        try {
          const res = await fetch(fcmUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: { title: title, body: msgBody },
                data: data || {},
                webpush: {
                  fcm_options: { link: 'https://codmpanda.pages.dev' }
                }
              }
            })
          });
          const json2 = await res.json();
          results.push({ token: token.slice(0, 12) + '...', ok: res.ok, response: json2 });
        } catch (e) {
          results.push({ token: token.slice(0, 12) + '...', ok: false, error: e.message });
        }
      }

      return json({ success: true, results });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },

  // ============================================
  // CRON — fires daily at 7 PM UTC
  // ============================================
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendDaily(env));
  }
};


// Shared Coach handler keeps /coach and legacy root requests on the same Gemini path.
async function handleCoach(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ success: false, error: 'AI is not configured. Check the GEMINI_API_KEY Worker secret.' }, 503);
  }
  try {
    const body = await request.json();
    const message = String(body.message || '').trim().slice(0, 1200);
    if (!message) return json({ success: false, error: 'Please enter a CODM question.' }, 400);
    const history = Array.isArray(body.history) ? body.history.slice(-10).map(item => ({
      role: item && (item.role === 'model' || item.role === 'assistant') ? 'model' : 'user',
      parts: [{ text: String(item && (item.text || item.content) || '').slice(0, 1200) }]
    })).filter(item => item.parts[0].text) : [];
    const playerName = String(body.playerName || body.profileName || '').trim().slice(0, 60);
    const systemText = 'You are CODMPanda Coach, a friendly, skilled Call of Duty: Mobile teammate and coach.' +
      (playerName ? ' The player’s current in-game/profile name is ' + JSON.stringify(playerName) + '; use it naturally but not in every reply.' : '') +
      ' Stay focused on CODM gameplay, weapons, builds, settings, HUD, sensitivity, movement, ranked, Battle Royale, multiplayer, events, updates, esports and CODMPanda features. Briefly redirect unrelated questions to CODM. Answer the exact question first with practical, specific advice; vary wording naturally, use the conversation context, and avoid generic filler. Do not invent current patch notes or weapon stats; acknowledge uncertainty when needed. Keep replies concise and teammate-like.';
    const answer = await callGemini(env, {
      systemInstruction: { parts: [{ text: systemText }] },
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      generationConfig: { temperature: 0.85, maxOutputTokens: 650 }
    });
    return json({ success: true, reply: answer });
  } catch (error) {
    console.error('[coach] Gemini request failed:', error?.message || error);
    return json({ success: false, error: 'The AI Coach could not respond right now. Please try again shortly.' }, 502);
  }
}

// ============================================
// DAILY NOTIFICATION
// ============================================
async function sendDaily(env) {
  try {
    const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    const accessToken = await getAccessToken(sa);
    if (!accessToken) { console.log('No token'); return; }

    const queryUrl = 'https://firestore.googleapis.com/v1/projects/' + sa.project_id + '/databases/(default)/documents:runQuery';
    const qRes = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'notificationsEnabled' },
              op: 'EQUAL',
              value: { booleanValue: true }
            }
          },
          limit: 500
        }
      })
    });

    const qData = await qRes.json();
    const tokens = [];
    for (const item of qData) {
      if (!item.document) continue;
      const fields = item.document.fields || {};
      const arr = fields.fcmTokens?.arrayValue?.values || [];
      for (const v of arr) {
        if (v.stringValue) tokens.push(v.stringValue);
      }
    }

    if (tokens.length === 0) { console.log('No tokens'); return; }

    const day = new Date().getUTCDay();
    const messages = [
      { t: '🎮 Find your squad', b: 'New lobbies are live. Jump in and dominate.' },
      { t: '🔧 Fresh builds today', b: 'See what the community is cooking in the Lab.' },
      { t: '🎯 Track your camo grind', b: "You're closer to Damascus than you think." },
      { t: '🔥 New leaks dropped', b: 'Check Intel for the latest intel.' },
      { t: '🏆 Climb the leaderboard', b: 'Post, comment, and earn your spot.' },
      { t: '⚡ Quick matches waiting', b: 'Squad up in under 30 seconds.' },
      { t: '🐼 CODMPanda weekly', b: "See what's hot this week." }
    ];
    const msg = messages[day];

    const fcmUrl = 'https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send';
    let sent = 0;
    for (const token of tokens) {
      try {
        const r = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: msg.t, body: msg.b },
              data: { type: 'daily' },
              webpush: { fcm_options: { link: 'https://codmpanda.pages.dev' } }
            }
          })
        });
        if (r.ok) sent++;
      } catch (e) {}
    }
    console.log('Daily notifications sent:', sent);
  } catch (e) {
    console.error('sendDaily error:', e);
  }
}

// ============================================
// GET FIREBASE ACCESS TOKEN
// ============================================
async function getAccessToken(serviceAccount) {
  try {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600
    };

    const encoder = new TextEncoder();
    const b64url = function(obj) {
      return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const unsignedToken = b64url(header) + '.' + b64url(payload);

    const pemContents = serviceAccount.private_key
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');

    const binaryKey = Uint8Array.from(atob(pemContents), function(c) { return c.charCodeAt(0); });

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      encoder.encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode.apply(null, new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const jwt = unsignedToken + '.' + signatureB64;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch (e) {
    console.error('Token error:', e);
    return null;
  }
}


async function fetchOfficialBriefings() {
  const sources = [
    { name: 'Official CODM News', url: 'https://www.callofduty.com/blog/mobile', sitemap: 'https://www.callofduty.com/sitemap.xml', hosts: ['www.callofduty.com'], article: /\/(?:blog)\//i },
    { name: 'COD Mobile Support', url: 'https://support.activision.com/cod-mobile', sitemap: 'https://support.activision.com/sitemap.xml', hosts: ['support.activision.com'], article: /\/(?:articles|cod-mobile)\//i },
    { name: 'Official CODM Game Page', url: 'https://www.callofduty.com/mobile', hosts: ['www.callofduty.com'], article: /\/(?:blog)\//i }
  ];
  const decode = value => String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  const textOf = value => decode(String(value || '')
    .replace(/<(script|style|nav|header|footer|aside|form|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(h1|h2|h3|h4|p|li|blockquote|time|section)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const readMeta = (html, keys) => {
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const key of keys) for (const tag of tags) {
      const name = (tag.match(/(?:name|property)=[\"']([^\"']+)[\"']/i) || [])[1];
      const content = (tag.match(/content=[\"']([^\"']*)[\"']/i) || [])[1];
      if (name && content && name.toLowerCase() === key.toLowerCase()) return textOf(content);
    }
    return '';
  };
  const fetchText = async url => {
    const response = await fetch(url, {
      headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.5', 'User-Agent': 'Mozilla/5.0 (compatible; CODMPandaBriefings/2.0)' },
      signal: AbortSignal.timeout(12000),
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.text();
  };
  const canonicalUrl = (href, base) => {
    try {
      const url = new URL(decode(href).replace(/&amp;/g, '&'), base);
      if (url.protocol !== 'https:') return null;
      url.hash = '';
      if (!['www.callofduty.com', 'callofduty.com', 'support.activision.com'].includes(url.hostname.toLowerCase())) return null;
      if (/\.(?:png|jpe?g|gif|svg|webp|pdf|css|js)(?:$|\?)/i.test(url.pathname)) return null;
      return url.href.replace(/\/$/, '');
    } catch (_) { return null; }
  };
  const looksLikeCODM = value => /call\s?of\s?duty\s?:?\s?mobile|cod\s?mobile|\bcodm\b|mobile/i.test(value || '');
  const linksFrom = (html, source) => {
    const found = [];
    const re = /<a\b([^>]*?)href=[\"']([^\"']+)[\"']([^>]*)>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = re.exec(html)) && found.length < 40) {
      const href = canonicalUrl(match[2], source.url);
      if (!href || href === source.url || !source.hosts.includes(new URL(href).hostname.toLowerCase())) continue;
      const title = textOf(match[4]) || readMeta(match[1] + match[3], ['aria-label', 'title']);
      if (title.length < 8 || title.length > 220) continue;
      const urlAndTitle = href + ' ' + title;
      const likelyArticle = source.article.test(new URL(href).pathname) &&
        (source.name === 'COD Mobile Support' || looksLikeCODM(urlAndTitle) ||
          /(?:season|patch|update|event|notes|announcement|news|roadmap|ranked|map|weapon|balance|redeem|community)/i.test(urlAndTitle));
      if (!likelyArticle) continue;
      if (!found.some(item => item.url === href)) found.push({ url: href, linkTitle: title, sourceName: source.name });
    }
    return found;
  };
  const sitemapLinksFrom = (xml, source) => {
    const found = [];
    const re = /<loc>\s*([^<]+)\s*<\/loc>/gi;
    let match;
    while ((match = re.exec(xml)) && found.length < 250) {
      const url = canonicalUrl(match[1], source.url);
      if (!url || url === source.url || !source.hosts.includes(new URL(url).hostname.toLowerCase())) continue;
      const path = new URL(url).pathname;
      if (!source.article.test(path)) continue;
      if (source.name !== 'COD Mobile Support' && !looksLikeCODM(url) &&
          !/(?:season|patch|update|event|notes|announcement|news|roadmap|ranked|weapon|balance|redeem|community)/i.test(path)) continue;
      if (!found.some(item => item.url === url)) found.push({ url, linkTitle: '', sourceName: source.name });
    }
    return found;
  };
  const candidates = [];
  await Promise.all(sources.map(async source => {
    const tasks = [];
    tasks.push(fetchText(source.url).then(html => candidates.push(...linksFrom(html, source)))
      .catch(error => console.warn('[briefings] Listing unavailable:', source.url, error?.message || error)));
    if (source.sitemap) tasks.push(fetchText(source.sitemap).then(async xml => {
      let sitemapXml = xml;
      if (/<sitemapindex\b/i.test(xml)) {
        const children = (xml.match(/<loc>\s*[^<]+\s*<\/loc>/gi) || []).slice(0, 4)
          .map(tag => (tag.match(/<loc>\s*([^<]+)\s*<\/loc>/i) || [])[1]).filter(Boolean);
        const childXml = await Promise.all(children.map(url => fetchText(url).catch(() => '')));
        sitemapXml = childXml.join('\n');
      }
      candidates.push(...sitemapLinksFrom(sitemapXml, source));
    }).catch(error => console.warn('[briefings] Sitemap unavailable:', source.sitemap, error?.message || error)));
    await Promise.all(tasks);
  }));
  // Prefer unique article URLs and fetch their actual page bodies; source landing pages are never
  // presented as news articles or summarized from meta descriptions alone.
  const unique = [];
  const seen = new Set();
  for (const item of candidates) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    unique.push(item);
  }
  const articleResults = [];
  await Promise.all(unique.slice(0, 12).map(async link => {
    try {
      const html = await fetchText(link.url);
      const canonicalMatch = html.match(/<link\b[^>]*rel=[\"']canonical[\"'][^>]*href=[\"']([^\"']+)[\"']/i);
      const finalUrl = canonicalMatch ? canonicalUrl(canonicalMatch[1], link.url) || link.url : link.url;
      const title = readMeta(html, ['og:title', 'twitter:title']) ||
        textOf((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]) ||
        textOf((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]) || link.linkTitle;
      const articleBlocks = [
        (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || [])[1] || '',
        (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || '',
        (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || ''
      ];
      const articleText = articleBlocks.map(textOf).sort((a, b) => b.length - a.length)[0].slice(0, 12000);
      // Article summaries must be grounded in actual extracted body text, not a site description.
      if (articleText.length < 180 || title.length < 8) {
        console.warn('[briefings] Skipping thin article body:', finalUrl, articleText.length);
        return;
      }
      const publishedRaw = readMeta(html, ['article:published_time', 'datePublished', 'date', 'publish-date']) ||
        (html.match(/<time\b[^>]*datetime=[\"']([^\"']+)[\"']/i) || [])[1] || '';
      const publishedAt = publishedRaw ? String(publishedRaw).slice(0, 32) : '';
      articleResults.push({
        sourceName: link.sourceName, title: title.slice(0, 180), summary: '',
        articleText, isArticle: true, url: finalUrl, publishedAt
      });
    } catch (error) {
      console.warn('[briefings] Article fetch failed:', link.url, error?.message || error);
    }
  }));
  articleResults.sort((a, b) => {
    const da = Date.parse(a.publishedAt || '') || 0, db = Date.parse(b.publishedAt || '') || 0;
    return db - da;
  });
  return articleResults.slice(0, 8);
}

// ============================================
// GEMINI AI HELPERS
// ============================================
async function callGemini(env, payload) {
  const model = String(env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[Gemini] API status:', response.status, data?.error?.message || '');
    throw new Error('Gemini API returned ' + response.status);
  }
  const text = (data.candidates || []).flatMap(candidate => candidate.content?.parts || [])
    .map(part => part.text || '').join('\n').trim();
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

async function summarizeOfficialBriefings(items, env) {
  if (!env.GEMINI_API_KEY) {
    return items.map(item => ({ ...item, summary: '', aiSummary:false }));
  }
  return Promise.all(items.map(async item => {
    if (!item.isArticle || !item.articleText || item.articleText.trim().length < 120) {
      return { ...item, summary: '', aiSummary:false };
    }
    try {
      const summary = await callGemini(env, {
        systemInstruction: {
          parts: [{ text: 'You summarize official Call of Duty: Mobile news for players. Use only the supplied official article text and its title. If the article body is short, summarize only what the supplied text supports rather than returning a generic description. Write 2-4 natural sentences explaining what is actually announced and why players should care. Preserve dates, season names, modes, rewards, and availability details when stated. Do not add speculation or facts not in the article. If the article text is too thin, say so briefly.' }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: 'Official source: ' + item.sourceName + '\nTitle: ' + item.title + '\nPublished: ' + item.publishedAt + '\nArticle text:\\n' + item.articleText.slice(0, 9000) }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 220 }
      });
      return { ...item, summary, aiSummary:true };
    } catch (error) {
      console.warn('[briefings] AI summary failed for', item.url, error?.message || error);
      return { ...item, summary: '', aiSummary:false };
    }
  }));
}

// ============================================
// JSON RESPONSE HELPER
// ============================================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
