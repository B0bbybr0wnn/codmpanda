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
        build: 'codmpanda-coach-briefings-v4',
        coachRouteConfigured: true,
        serviceAccountConfigured: !!env.FIREBASE_SERVICE_ACCOUNT_JSON,
        aiConfigured: !!env.GEMINI_API_KEY,
        routes: ['GET /health', 'GET /briefings', 'POST /coach', 'POST /send']
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

    if (path === '/coach' && request.method === 'POST') {
      if (!env.GEMINI_API_KEY) {
        return json({ error: 'AI is not configured yet. Add the GEMINI_API_KEY secret to this Worker.' }, 503);
      }
      try {
        const body = await request.json();
        const message = String(body.message || '').trim().slice(0, 1200);
        if (!message) return json({ error: 'Please enter a message.' }, 400);
        const history = Array.isArray(body.history) ? body.history.slice(-10).map(item => ({
          role: item && item.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(item && item.text || '').slice(0, 1200) }]
        })).filter(item => item.parts[0].text) : [];
        const answer = await callGemini(env, {
          systemInstruction: {
            parts: [{ text: 'You are CODMPanda Coach, a friendly, skilled Call of Duty: Mobile coach. Your scope is strictly Call of Duty: Mobile and its gameplay, weapons, builds, settings, HUD, sensitivity, movement, ranked, Battle Royale, multiplayer, events, updates, esports, and CODMPanda features. If asked about an unrelated topic, briefly and kindly say you focus on CODM and invite a CODM question; do not answer the unrelated request. Treat gaming questions such as losing gunfights, aim inconsistency, teammates, or rank progression as in-scope. Speak naturally like a helpful teammate, not a corporate chatbot. Answer the exact question first, be practical and specific, ask one focused follow-up only when needed, and use recent conversation context. Do not invent current patch notes, weapon stats, or meta claims; say when unsure or lacking live data. Keep most replies concise but useful. Do not claim to be human.' }]
          },
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 650 }
        });
        return json({ success: true, reply: answer });
      } catch (error) {
        console.error('[coach] Gemini request failed:', error?.message || error);
        return json({ error: 'The AI Coach could not respond right now. Please try again shortly.' }, 502);
      }
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
    { name: 'Official CODM News', url: 'https://www.callofduty.com/blog/mobile' },
    { name: 'COD Mobile Support', url: 'https://support.activision.com/cod-mobile' },
    { name: 'Official CODM Game Page', url: 'https://www.callofduty.com/mobile' }
  ];
  const decode = value => String(value || '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n) || 32))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16) || 32));
  const clean = value => decode(String(value || '')
    .replace(/<(script|style|nav|header|footer|aside|form|noscript|svg|button)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(h1|h2|h3|h4|p|li|blockquote|time|article|section)>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  const getMeta = (html, key) => {
    for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
      const name = (tag.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i) || [])[1];
      const content = (tag.match(/content\s*=\s*["']([^"']*)["']/i) || [])[1];
      if (name && content && name.toLowerCase() === key.toLowerCase()) return clean(content);
    }
    return '';
  };
  const getPage = async url => {
    const response = await fetch(url, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
      cf: { cacheTtl: 180, cacheEverything: true }
    });
    if (!response.ok) throw new Error('Source returned HTTP ' + response.status);
    return response.text();
  };
  const discovered = [];
  await Promise.all(sources.map(async source => {
    try {
      const html = await getPage(source.url);
      const anchors = /<a\b([^>]*?)href\s*=\s*(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = anchors.exec(html)) && discovered.length < 50) {
        const rawHref = decode(match[3]).trim();
        const title = clean(match[5]).slice(0, 180);
        if (!rawHref || title.length < 8 || /^(read more|learn more|click here|details)$/i.test(title)) continue;
        let parsed;
        try { parsed = new URL(rawHref, source.url); } catch (_) { continue; }
        if (parsed.protocol !== 'https:') continue;
        const host = parsed.hostname.toLowerCase();
        const allowed = host === 'callofduty.com' || host.endsWith('.callofduty.com') ||
          host === 'activision.com' || host.endsWith('.activision.com');
        if (!allowed) continue;
        parsed.hash = '';
        const articleUrl = parsed.toString();
        if (articleUrl.replace(/\/$/, '') === source.url.replace(/\/$/, '')) continue;
        if (!(/\/blog\//i.test(parsed.pathname) || /\/articles?\//i.test(parsed.pathname) ||
              /\/support\//i.test(parsed.pathname) || /\/cod-mobile\//i.test(parsed.pathname))) continue;
        if (/\/(blog\/mobile|mobile|cod-mobile)\/?$/i.test(parsed.pathname)) continue;
        if (discovered.some(item => item.url === articleUrl)) continue;
        discovered.push({ sourceName: source.name, title, url: articleUrl });
      }
    } catch (error) {
      console.warn('[briefings] Discovery source unavailable:', source.url, error?.message || error);
    }
  }));
  const articles = await Promise.all(discovered.slice(0, 10).map(async item => {
    try {
      const html = await getPage(item.url);
      const title = getMeta(html, 'og:title') ||
        clean((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]) || item.title;
      const published = getMeta(html, 'article:published_time') ||
        getMeta(html, 'datePublished') ||
        ((html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i) || [])[1] || '');
      const block = (html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
        html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
        html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || '';
      const articleText = clean(block).slice(0, 10000);
      if (articleText.length < 120) {
        return { ...item, title: clean(title).slice(0, 180), summary: '', articleText: '', isArticle: true,
          publishedAt: published ? clean(published).slice(0, 40) : '' };
      }
      return { ...item, title: clean(title).slice(0, 180), summary: '', articleText, isArticle: true,
        publishedAt: published ? clean(published).slice(0, 40) : '' };
    } catch (error) {
      console.warn('[briefings] Article fetch failed:', item.url, error?.message || error);
      return null;
    }
  }));
  const seen = new Set();
  return articles.filter(item => {
    if (!item || !item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, 8);
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
          parts: [{ text: 'Official source: ' + item.sourceName + '\\nTitle: ' + item.title + '\\nPublished: ' + item.publishedAt + '\\nArticle text:\\n' + item.articleText.slice(0, 9000) }]
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
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
