// CODMPanda Notify — clean Cloudflare Worker
// Required secrets: GEMINI_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON
const BUILD = 'codmpanda-worker-v1';
const APP_URL = 'https://codmpanda.pages.dev';
// Google-maintained alias that follows the latest stable Flash model.
const MODEL = 'gemini-flash-latest';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (request.method === 'GET' && path === '/health') return json({
      status: 'ok', service: 'codmpanda-notify', build: BUILD,
      aiConfigured: Boolean(env.GEMINI_API_KEY),
      serviceAccountConfigured: Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON),
      aiProvider: env.GEMINI_API_KEY ? 'gemini' : 'none',
      geminiModel: MODEL,
      routes: ['GET /health', 'GET /briefings', 'POST /coach', 'POST /send'],
    });
    if (request.method === 'GET' && path === '/briefings') return briefingsRoute(env);
    if (request.method === 'POST' && path === '/coach') return coachRoute(request, env);
    if (request.method === 'POST' && path === '/') {
      let body = {};
      try { body = await request.clone().json(); } catch {}
      if (['message', 'question', 'prompt', 'text'].some(k => typeof body[k] === 'string' && body[k].trim())) return coachRoute(request, env);
      return sendRoute(request, env);
    }
    if (request.method === 'POST' && path === '/send') return sendRoute(request, env);
    if (!['GET', 'POST'].includes(request.method)) return json({ success: false, error: 'Method not allowed.' }, 405);
    return json({ success: false, error: 'Not found.', routes: ['/health', '/briefings', '/coach', '/send'] }, 404);
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(sendDaily(env)); },
};

async function coachRoute(request, env) {
  if (!env.GEMINI_API_KEY) return json({ success: false, error: 'AI is not configured on this Worker.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ success: false, error: 'Request body must be valid JSON.' }, 400); }
  const message = String(body.message || body.question || body.prompt || body.text || '').trim().slice(0, 1500);
  if (!message) return json({ success: false, error: 'Please enter a CODM question.' }, 400);
  const history = (Array.isArray(body.history) ? body.history : []).slice(-8).map(x => ({
    role: ['assistant', 'model'].includes(x?.role) ? 'model' : 'user',
    parts: [{ text: String(x?.text || x?.content || '').trim().slice(0, 1000) }],
  })).filter(x => x.parts[0].text);
  const player = String(body.playerName || body.profileName || '').trim().slice(0, 60);
  const system = 'You are CODMPanda Coach, a friendly and skilled Call of Duty: Mobile teammate. Focus on CODM gameplay, gunsmith builds, settings, HUD, sensitivity, movement, ranked, Battle Royale, multiplayer, events, updates, esports and CODMPanda. Answer the exact question first with practical, concise advice. Do not invent current patch notes or weapon stats; acknowledge uncertainty.' + (player ? ` The player's in-game name is ${JSON.stringify(player)}; use it naturally but not every reply.` : '');
  try {
    const reply = await gemini(env, { systemInstruction: { parts: [{ text: system }] }, contents: [...history, { role: 'user', parts: [{ text: message }] }], generationConfig: { temperature: 0.75, maxOutputTokens: 650 } });
    return json({ success: true, reply });
  } catch (e) { console.error('[coach]', errText(e)); return json({ success: false, error: 'The AI Coach could not respond right now. Please try again shortly.' }, 502); }
}

async function gemini(env, payload) {
  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  const model = MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  // Keep the whole operation comfortably below the app's ~30s request cutoff.
  const deadline = Date.now() + 22000;
  for (let attempt = 0; attempt < 3; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining < 1000) throw new Error('Gemini request timed out before the response was ready');
    let response;
    try { response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(payload), signal: AbortSignal.timeout(Math.min(18000, remaining)) }); }
    catch (e) { throw new Error('Gemini network/timeout error: ' + (e?.message || String(e))); }
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const answer = (data.candidates || []).flatMap(c => c.content?.parts || []).map(p => p.text || '').join('\n').trim();
      if (answer) return answer;
      throw new Error('Gemini returned no text' + (data.candidates?.[0]?.finishReason ? ` (${data.candidates[0].finishReason})` : ''));
    }
    const message = data.error?.message || `HTTP ${response.status}`;
    if (!(response.status === 429 || [500, 502, 503, 504].includes(response.status)) || attempt === 2) throw new Error(`Gemini ${response.status}: ${message}`);
    await wait(attempt === 0 ? 300 : 500);
  }
  throw new Error('Gemini request failed');
}

async function briefingsRoute(env) {
  try {
    const articles = await getOfficialArticles();
    const summaries = [];
    for (let i = 0; i < articles.length; i += 2) {
      summaries.push(...await Promise.all(articles.slice(i, i + 2).map(async article => {
        try {
          const summary = await gemini(env, {
            systemInstruction: { parts: [{ text: 'Summarize official Call of Duty: Mobile news using only the title and article text. Write 2–4 concise sentences stating what changed or was announced and why players should care. Preserve dates, season names, modes, rewards and availability details. Do not speculate.' }] },
            contents: [{ role: 'user', parts: [{ text: `Source: ${article.sourceName}\nTitle: ${article.title}\nPublished: ${article.publishedAt || 'Not listed'}\nArticle:\n${article.articleText.slice(0, 7500)}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 220 },
          });
          return { ...article, summary, aiSummary: true };
        } catch (e) { console.warn('[briefings summary]', article.url, errText(e)); return { ...article, summary: '', aiSummary: false }; }
      })));
    }
    const output = summaries.map(({ articleText, ...x }) => x);
    return json({ success: output.some(x => x.aiSummary && x.summary), aiConfigured: Boolean(env.GEMINI_API_KEY), sourcesChecked: 3, articlesFound: output.length, summariesGenerated: output.filter(x => x.aiSummary && x.summary).length, updatedAt: new Date().toISOString(), briefings: output });
  } catch (e) { console.error('[briefings]', errText(e)); return json({ success: false, error: 'Could not load official CODM briefings.', briefings: [] }, 502); }
}

async function getOfficialArticles() {
  const sources = [
    { name: 'Official CODM News', url: 'https://www.callofduty.com/blog/mobile', host: 'www.callofduty.com', sitemap: 'https://www.callofduty.com/sitemap.xml' },
    { name: 'COD Mobile Support', url: 'https://support.activision.com/cod-mobile', host: 'support.activision.com', sitemap: 'https://support.activision.com/sitemap.xml' },
    { name: 'Official CODM Game Page', url: 'https://www.callofduty.com/mobile', host: 'www.callofduty.com' },
  ];
  const candidates = new Map();
  await Promise.all(sources.map(async s => {
    try {
      const html = await fetchText(s.url);
      const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m, count = 0;
      while ((m = re.exec(html)) && count < 80) {
        const link = articleUrl(m[1], s); const title = textOf(m[2]);
        if (!link || title.length < 8) continue;
        candidates.set(link, { url: link, title, sourceName: s.name }); count++;
      }
    } catch (e) { console.warn('[briefings listing]', s.url, errText(e)); }
    if (s.sitemap) try {
      const xml = await fetchText(s.sitemap); const re = /<loc>\s*([^<]+)\s*<\/loc>/gi; let m, count = 0;
      while ((m = re.exec(xml)) && count < 80) { const link = articleUrl(m[1], s); if (link) { candidates.set(link, { url: link, title: '', sourceName: s.name }); count++; } }
    } catch (e) { console.warn('[briefings sitemap]', s.sitemap, errText(e)); }
  }));
  const picked = [...candidates.values()].slice(0, 12);
  const results = await Promise.all(picked.map(async item => {
    try {
      const html = await fetchText(item.url);
      const title = textOf((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || meta(html, ['og:title', 'twitter:title']) || (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || item.title);
      let body = textOf((html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) || [])[1] || (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [])[1] || '');
      if (body.length < 180) return null;
      const publishedAt = meta(html, ['article:published_time', 'datePublished', 'date', 'publish-date']) || ((html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i) || [])[1] || '');
      const date = Date.parse(publishedAt);
      if (date && (date < Date.now() - 180 * 86400000 || date > Date.now() + 45 * 86400000)) return null;
      return { sourceName: item.sourceName, title: title.slice(0, 180), summary: '', aiSummary: false, url: item.url, publishedAt: publishedAt.slice(0, 40), articleText: body.slice(0, 9000) };
    } catch (e) { console.warn('[briefings article]', item.url, errText(e)); return null; }
  }));
  const unique = new Map();
  for (const a of results.filter(Boolean)) if (!unique.has(a.url)) unique.set(a.url, a);
  return [...unique.values()].sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0)).slice(0, 8);
}
function articleUrl(href, source) {
  try {
    const u = new URL(decode(href), source.url);
    if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== source.host) return null;
    u.hash = '';
    if (/\.(png|jpe?g|gif|svg|webp|pdf|css|js|xml)(?:$|\?)/i.test(u.pathname)) return null;
    if (u.pathname.replace(/\/$/, '') === new URL(source.url).pathname.replace(/\/$/, '')) return null;
    if (source.host === 'www.callofduty.com' && !/\/blog\//i.test(u.pathname)) return null;
    if (source.host === 'support.activision.com' && !/\/(articles|cod-mobile)\//i.test(u.pathname)) return null;
    if (!/call\s?of\s?duty|cod\s?mobile|\bcodm\b|season|patch|update|event|notes|announcement|news|roadmap|ranked|weapon|balance|redeem|community|mobile/i.test(u.href)) return null;
    return u.href.replace(/\/$/, '');
  } catch { return null; }
}
async function fetchText(url) {
  const r = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.5', 'User-Agent': 'Mozilla/5.0 (compatible; CODMPanda/1.0)' }, signal: AbortSignal.timeout(12000), cf: { cacheTtl: 120, cacheEverything: true } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
function textOf(x) { return decode(String(x || '').replace(/<(script|style|nav|header|footer|aside|form|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(h1|h2|h3|h4|p|li|blockquote|time|section|div)>/gi, '. ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function meta(html, keys) { const tags = html.match(/<meta\b[^>]*>/gi) || []; for (const k of keys) for (const tag of tags) { const n = (tag.match(/(?:name|property)=["']([^"']+)["']/i) || [])[1]; const c = (tag.match(/content=["']([^"']*)["']/i) || [])[1]; if (n?.toLowerCase() === k.toLowerCase() && c) return textOf(c); } return ''; }
function decode(x) { return String(x || '').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&nbsp;|&#160;/gi, ' '); }

async function sendRoute(request, env) {
  let body; try { body = await request.json(); } catch { return json({ success: false, error: 'Request body must be valid JSON.' }, 400); }
  const tokens = Array.isArray(body.tokens) ? [...new Set(body.tokens.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()))] : [];
  if (!tokens.length) return json({ success: false, error: 'No tokens provided.' }, 400);
  let sa; try { sa = serviceAccount(env); } catch { return json({ success: false, error: 'Firebase service account secret is missing or invalid.' }, 503); }
  try {
    const access = await firebaseToken(sa);
    const results = await Promise.all(tokens.map(async token => {
      try {
        const r = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/messages:send`, { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token, notification: { title: String(body.title || 'CODMPanda').slice(0, 120), body: String(body.body || '').slice(0, 1000) }, data: fcmData(body.data), webpush: { fcm_options: { link: APP_URL } } } }), signal: AbortSignal.timeout(15000) });
        const d = await r.json().catch(() => ({}));
        return { token: token.slice(0, 10) + '…', ok: r.ok, ...(!r.ok ? { error: d.error?.message || `FCM HTTP ${r.status}` } : {}) };
      } catch (e) { return { token: token.slice(0, 10) + '…', ok: false, error: errText(e) }; }
    }));
    return json({ success: results.some(x => x.ok), sent: results.filter(x => x.ok).length, failed: results.filter(x => !x.ok).length, results });
  } catch (e) { console.error('[send]', errText(e)); return json({ success: false, error: 'Firebase could not send notifications. Check service-account permissions.' }, 502); }
}

async function sendDaily(env) {
  try {
    const sa = serviceAccount(env); const access = await firebaseToken(sa);
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/databases/(default)/documents:runQuery`, { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'users' }], where: { fieldFilter: { field: { fieldPath: 'notificationsEnabled' }, op: 'EQUAL', value: { booleanValue: true } } }, limit: 500 } }), signal: AbortSignal.timeout(20000) });
    const rows = await r.json().catch(() => []); if (!r.ok || !Array.isArray(rows)) throw new Error(`Firestore query HTTP ${r.status}`);
    const tokens = new Set(); for (const row of rows) { const f = row.document?.fields || {}; for (const v of f.fcmTokens?.arrayValue?.values || []) if (v.stringValue) tokens.add(v.stringValue); if (f.fcmToken?.stringValue) tokens.add(f.fcmToken.stringValue); }
    if (!tokens.size) { console.log('[daily] no tokens'); return; }
    const messages = [
      ['🎮 Find your squad', 'New lobbies are live. Jump in and dominate.'], ['🔧 Fresh builds today', 'See what the community is cooking in the Lab.'], ['🎯 Track your camo grind', "You're closer to Damascus than you think."], ['🔥 Check CODM Intel', 'See the latest official COD Mobile updates.'], ['🏆 Climb the leaderboard', 'Post, comment, and earn your spot.'], ['⚡ Squad up', 'Find teammates and get into a match.'], ['🐼 CODMPanda weekly', "See what's hot in the community this week."],
    ][new Date().getUTCDay()];
    let sent = 0; for (const token of tokens) { try { const x = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(sa.project_id)}/messages:send`, { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { token, notification: { title: messages[0], body: messages[1] }, data: { type: 'daily' }, webpush: { fcm_options: { link: APP_URL } } } }), signal: AbortSignal.timeout(12000) }); if (x.ok) sent++; } catch {} }
    console.log(`[daily] sent ${sent}/${tokens.size}`);
  } catch (e) { console.error('[daily]', errText(e)); }
}
function serviceAccount(env) { let sa; try { sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON || ''); } catch { throw new Error('Bad Firebase JSON'); } if (!sa.project_id || !sa.client_email || !sa.private_key) throw new Error('Firebase fields missing'); return sa; }
async function firebaseToken(sa) {
  const enc = new TextEncoder(), now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' }, payload = { iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const unsigned = b64url(enc.encode(JSON.stringify(header))) + '.' + b64url(enc.encode(JSON.stringify(payload)));
  const pem = String(sa.private_key).replace(/\\n/g, '\n').replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned));
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: unsigned + '.' + b64url(new Uint8Array(sig)) }), signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({})); if (!response.ok || !data.access_token) throw new Error(`Google OAuth failed: ${data.error_description || data.error || response.status}`); return data.access_token;
}
function b64url(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
function fcmData(data) { const out = {}; if (!data || typeof data !== 'object' || Array.isArray(data)) return out; for (const [k, v] of Object.entries(data).slice(0, 20)) if (['string', 'number', 'boolean'].includes(typeof v)) out[String(k).slice(0, 40)] = String(v).slice(0, 500); return out; }
function errText(e) { return String(e?.message || e || 'Unknown error').slice(0, 300); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
