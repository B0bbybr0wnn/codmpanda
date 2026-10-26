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
        build: 'codmpanda-coach-briefings-v8',
        coachRouteConfigured: true,
        coachRootCompatibility: true,
        briefingDiscovery: 'official-html+sitemaps',
        serviceAccountConfigured: !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
        aiConfigured: hasAIKey(env),
        aiProvider: getAIProvider(env),
        routes: ['GET /health', 'GET /briefings', 'POST /coach', 'POST /send'],
        geminiModel: String(env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '')
      });
    }

    if (path === '/briefings' && request.method === 'GET') {
      try {
        const rawBriefings = await fetchOfficialBriefings();
        const briefings = await summarizeOfficialBriefings(rawBriefings, env);
        const usable = briefings.filter(item => item.isArticle && item.articleText && item.articleText.length >= 180);
        return json({
          success: usable.some(item => item.aiSummary && item.summary),
          aiConfigured: !!env.GEMINI_API_KEY,
          sourcesChecked: 3,
          articlesFound: usable.length,
          summariesGenerated: usable.filter(item => item.aiSummary && item.summary).length,
          updatedAt: new Date().toISOString(),
          briefings: usable.map(({ articleText, isArticle, ...item }) => item)
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
        .then(body => [body?.message, body?.question, body?.prompt, body?.text].some(value => typeof value === 'string' && value.trim().length > 0))
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
  if (!hasAIKey(env)) {
    return json({ success: false, error: 'AI is not configured. Check the GEMINI_API_KEY Worker secret.' }, 503);
  }
  try {
    const body = await request.json();
    const message = String(body.message || body.question || body.prompt || body.text || '').trim().slice(0, 1200);
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
      const articlePath = new URL(href).pathname;
      if (source.name === 'COD Mobile Support' && /\/articles\/(?:all|index)\.html?$/i.test(articlePath)) continue;
      const urlAndTitle = href + ' ' + title;
      const likelyArticle = source.article.test(articlePath) &&
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
        const allChildren = (xml.match(/<loc>\s*[^<]+\s*<\/loc>/gi) || [])
          .map(tag => (tag.match(/<loc>\s*([^<]+)\s*<\/loc>/i) || [])[1]).filter(Boolean);
        const priorityChildren = allChildren.filter(url => /blog|mobile|article|news|support|sitemap/i.test(url));
        const children = (priorityChildren.length ? priorityChildren : allChildren).slice(0, 10);
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
  // Reserve a few article slots for each official source so the largest listing cannot crowd out Support.
  const selected = [];
  const selectedUrls = new Set();
  for (const source of sources) {
    for (const link of unique.filter(item => item.sourceName === source.name).slice(0, 4)) {
      if (!selectedUrls.has(link.url)) { selected.push(link); selectedUrls.add(link.url); }
    }
  }
  for (const link of unique) {
    if (selected.length >= 12) break;
    if (!selectedUrls.has(link.url)) { selected.push(link); selectedUrls.add(link.url); }
  }
  const articleResults = [];
  await Promise.all(selected.map(async link => {
    try {
      const html = await fetchText(link.url);
      const canonicalMatch = html.match(/<link\b[^>]*rel=[\"']canonical[\"'][^>]*href=[\"']([^\"']+)[\"']/i);
      const finalUrl = canonicalMatch ? canonicalUrl(canonicalMatch[1], link.url) || link.url : link.url;
      const h1Title = textOf((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
      const metaTitle = readMeta(html, ['og:title', 'twitter:title']);
      const pageTitle = textOf((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
      const articleBlocks = [
        (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || [])[1] || '',
        (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || '',
        (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || ''
      ];
      // Some official pages publish their real article body as JSON-LD instead of a normal <article> node.
      const jsonLdBodies = [], jsonLdTitles = [], jsonLdDates = [];
      const jsonLdScripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
      for (const script of jsonLdScripts) {
        const match = script.match(/>([\s\S]*?)<\/script>/i);
        if (!match) continue;
        try {
          const parsed = JSON.parse(match[1].replace(/^\s*<!--|-->\s*$/g, ''));
          const stack = [parsed];
          while (stack.length) {
            const value = stack.pop();
            if (!value || typeof value !== 'object') continue;
            if (Array.isArray(value)) { stack.push(...value); continue; }
            if (typeof value.articleBody === 'string') jsonLdBodies.push(value.articleBody);
            if (typeof value.headline === 'string') jsonLdTitles.push(value.headline);
            if (typeof value.datePublished === 'string') jsonLdDates.push(value.datePublished);
            if (value['@graph']) stack.push(value['@graph']);
            if (value.mainEntity) stack.push(value.mainEntity);
            if (value.mainEntityOfPage && typeof value.mainEntityOfPage === 'object') stack.push(value.mainEntityOfPage);
          }
        } catch (_) { /* malformed or unrelated JSON-LD is not article text */ }
      }
      const title = h1Title || jsonLdTitles.find(value => value.trim().length >= 8) || metaTitle || pageTitle || link.linkTitle;
      // Prefer the article's own content over the whole page, which includes menus and related links.
      const articleCandidate = textOf(articleBlocks[0]);
      const jsonLdCandidate = jsonLdBodies.map(textOf).sort((a, b) => b.length - a.length)[0] || '';
      const mainCandidate = textOf(articleBlocks[1]);
      const pageCandidate = textOf(articleBlocks[2]);
      const articleText = [articleCandidate, jsonLdCandidate, mainCandidate, pageCandidate]
        .find(candidate => candidate.length >= 180) || '';
      // Article summaries must be grounded in actual extracted body text, not a site description.
      if (articleText.length < 180 || title.length < 8) {
        console.warn('[briefings] Skipping thin article body:', finalUrl, articleText.length);
        return;
      }
      const publishedRaw = readMeta(html, ['article:published_time', 'datePublished', 'date', 'publish-date']) ||
        (html.match(/<time\\b[^>]*datetime=[\\"']([^\\"']+)[\\"']/i) || [])[1] ||
        jsonLdDates.find(value => Date.parse(value)) || '';
      const publishedAt = publishedRaw ? String(publishedRaw).slice(0, 32) : '';
      articleResults.push({
        sourceName: link.sourceName, title: title.slice(0, 180), summary: '',
        articleText: articleText.slice(0, 12000), isArticle: true, url: finalUrl, publishedAt
      });
    } catch (error) {
      console.warn('[briefings] Article fetch failed:', link.url, error?.message || error);
    }
  }));
  const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const futureLimit = Date.now() + 45 * 24 * 60 * 60 * 1000;
  const fresh = [];
  const seenCanonical = new Set();
  const seenTitles = new Set();
  for (const item of articleResults) {
    const canonical = String(item.url || '').replace(/\/$/, '').toLowerCase();
    const titleKey = String(item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const published = Date.parse(item.publishedAt || '');
    // Avoid old news resurfacing as current intel; unknown dates are kept only when the
    // official page supplied a real body and the canonical URL/title are unique.
    if (published && (published < cutoff || published > futureLimit)) continue;
    if (canonical && seenCanonical.has(canonical)) continue;
    if (titleKey && seenTitles.has(titleKey)) continue;
    if (canonical) seenCanonical.add(canonical);
    if (titleKey) seenTitles.add(titleKey);
    fresh.push(item);
  }
  fresh.sort((a, b) => {
    const da = Date.parse(a.publishedAt || '') || 0, db = Date.parse(b.publishedAt || '') || 0;
    return db - da;
  });
  return fresh.slice(0, 8);
}

// ============================================
// GEMINI AI HELPERS
// ============================================
async function callGemini(env, payload) {
  const model = String(env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
  let response, data = {};
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    });
    data = await response.json().catch(() => ({}));
    if (response.ok) break;
    const retryable = response.status === 429 || [500, 502, 503, 504].includes(response.status);
    if (!retryable || attempt === 2) {
      console.error('[Gemini] API status:', response.status, data?.error?.message || '');
      throw new Error('Gemini API returned ' + response.status);
    }
    await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 650 : 1400));
  }
  const text = (data.candidates || []).flatMap(candidate => candidate.content?.parts || [])
    .map(part => part.text || '').join('\n').trim();
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
}

async function summarizeOfficialBriefings(items, env) {
  if (!hasAIKey(env)) {
    console.warn('[briefings] No supported AI API key is bound to this Worker.');
    return items.map(item => ({ ...item, summary: '', aiSummary: false }));
  }
  const summarizeOne = async item => {
    if (!item.isArticle || !item.articleText || item.articleText.trim().length < 120) {
      return { ...item, summary: '', aiSummary: false };
    }
    try {
      const summary = await callGemini(env, {
        systemInstruction: {
          parts: [{ text: 'You summarize official Call of Duty: Mobile news for players. Use only the supplied official article text and title. Write 2-4 natural sentences explaining what is actually announced and why players should care. Preserve dates, season names, modes, rewards, and availability details when stated. Do not add speculation or replace the article with generic CODM information.' }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: 'Official source: ' + item.sourceName + '\nTitle: ' + item.title + '\nPublished: ' + item.publishedAt + '\nArticle text:\n' + item.articleText.slice(0, 9000) }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 220 }
      });
      return { ...item, summary, aiSummary: true };
    } catch (error) {
      console.warn('[briefings] AI summary failed for', item.url, error?.message || error);
      return { ...item, summary: '', aiSummary: false };
    }
  };
  const output = [];
  for (let i = 0; i < items.length; i += 2) {
    output.push(...await Promise.all(items.slice(i, i + 2).map(summarizeOne)));
  }
  return output;
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
