// CODMPanda Notify — clean Cloudflare Worker
// Required secrets: GEMINI_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON
const BUILD = 'codmpanda-worker-v7';
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
      aiConfigured: Boolean(env.GEMINI_API_KEY || env.DEEPSEEK_API_KEY),
      deepseekConfigured: Boolean(env.DEEPSEEK_API_KEY),
      serviceAccountConfigured: Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON),
      aiProvider: env.GEMINI_API_KEY && env.DEEPSEEK_API_KEY ? 'gemini+deepseek-fallback' : env.GEMINI_API_KEY ? 'gemini' : env.DEEPSEEK_API_KEY ? 'deepseek' : 'none',
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
  if (!env.GEMINI_API_KEY && !env.DEEPSEEK_API_KEY) return json({ success: false, error: 'AI is not configured on this Worker.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ success: false, error: 'Request body must be valid JSON.' }, 400); }
  const message = String(body.message || body.question || body.prompt || body.text || '').trim().slice(0, 1500);
  if (!message) return json({ success: false, error: 'Please enter a CODM question.' }, 400);
  const rawHistory = (Array.isArray(body.history) ? body.history : []).slice(-8);
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const history = rawHistory.filter(x => {
    const stamp = Number(x?.timestamp || x?.createdAt || x?.time || 0);
    return !stamp || (stamp < 1e12 ? stamp * 1000 : stamp) >= cutoff;
  }).map(x => ({
    role: ['assistant', 'model'].includes(x?.role) ? 'model' : 'user',
    parts: [{ text: String(x?.text || x?.content || '').trim().slice(0, 1000) }],
  })).filter(x => x.parts[0].text);
  const player = String(body.playerName || body.profileName || '').trim().slice(0, 60);
  const codmTopic = /\b(codm|cod\s?mobile|call\s?of\s?duty|gunsmith|loadout|weapon|gun|ranked|battle royale|br match|multiplayer|mp match|sensitivity|hud|aim|recoil|legendary|mythic|camouflage|camo|grind|operator skill|scorestreak|perk|clan war|shipment|nuketown|rank reset|season|battle pass|redeem code|activision|codmpanda)\b/i;
  const greeting = /^(hi|hey|hello|yo|sup|what's up|whats up|good morning|good afternoon|good evening|thanks|thank you|ok|okay|lol|😂|👍)[!.?\s]*$/i.test(message);
  const historyHasCodmContext = history.some(x => codmTopic.test(x.parts[0].text));
  if (!codmTopic.test(message) && !historyHasCodmContext && !greeting) {
    return json({ success: true, reply: 'Bro, I’m here for CODM 😄 Ask me about gunsmith builds, ranked, BR, sensitivity, movement, events, or anything Call of Duty: Mobile.' });
  }
  const system = 'You are CODMPanda Coach, a real, friendly CODM teammate—not a formal chatbot. ONLY help with Call of Duty: Mobile (CODM) and CODMPanda. If asked about anything else, briefly steer the user back to CODM. Talk naturally and directly; match the user’s tone, answer what they actually asked, and do not dump generic tips or repeat the question. Use prior messages to understand short follow-ups and maintain context. Ask one short clarifying question only when needed. Keep answers useful and as concise as the question deserves; use bullets only when they help. Never claim to remember details not present in the recent chat. Do not invent current patch notes, weapon stats, or event details; say when unsure. Avoid sounding scripted: vary openings and response structure based on the actual question, avoid repeating catchphrases or generic tips, and do not force slang into every reply. For follow-ups, continue directly from the conversation context; when corrected, acknowledge it briefly and adapt rather than repeating the same advice.' + (player ? ` The player's in-game name is ${JSON.stringify(player)}; use it naturally but not every reply.` : '');
  try {
    const reply = await gemini(env, { systemInstruction: { parts: [{ text: system }] }, contents: [...history, { role: 'user', parts: [{ text: message }] }], generationConfig: { temperature: 0.75, maxOutputTokens: 650 } });
    return json({ success: true, reply });
  } catch (e) { console.error('[coach]', errText(e)); return json({ success: false, error: 'The AI Coach could not respond right now. Please try again shortly.' }, 502); }
}

async function gemini(env, payload) {
  if (!env.GEMINI_API_KEY && !env.DEEPSEEK_API_KEY) throw new Error('No AI provider API key configured');
  const deadline = Date.now() + 15000;
  let lastError = 'All AI providers failed';

  // Try Gemini models first. Move quickly to the next provider when one is overloaded.
  if (env.GEMINI_API_KEY) {
    for (const model of [MODEL, 'gemini-3.5-flash-lite']) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) break;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(Math.min(4500, remaining))
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          const answer = (data.candidates || []).flatMap(x => x.content?.parts || []).map(x => x.text || '').join('\\n').trim();
          if (answer) return answer;
          lastError = `Gemini ${model} returned no text`;
        } else {
          lastError = `Gemini ${model} ${response.status}: ${data.error?.message || 'Request failed'}`;
          if (![429, 500, 502, 503, 504].includes(response.status)) break;
        }
      } catch (e) { lastError = `Gemini ${model}: ${e?.message || String(e)}`; }
    }
  }

  // DeepSeek uses an OpenAI-compatible chat-completions endpoint.
  if (env.DEEPSEEK_API_KEY && Date.now() < deadline - 500) {
    const messages = [];
    const system = payload.systemInstruction?.parts?.map(x => x.text || '').join('\\n').trim();
    if (system) messages.push({ role: 'system', content: system });
    for (const item of payload.contents || []) {
      const content = (item.parts || []).map(x => x.text || '').join('\\n').trim();
      if (content) messages.push({ role: item.role === 'model' ? 'assistant' : 'user', content });
    }
    try {
      const remaining = deadline - Date.now();
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify({ model: 'deepseek-flash', messages, stream: false, max_tokens: 650, thinking: { type: 'disabled' } }),
        signal: AbortSignal.timeout(Math.min(5000, remaining))
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const answer = String(data.choices?.[0]?.message?.content || '').trim();
        if (answer) return answer;
        lastError = 'DeepSeek returned no text';
      } else lastError = `DeepSeek ${response.status}: ${data.error?.message || 'Request failed'}`;
    } catch (e) { lastError = `DeepSeek: ${e?.message || String(e)}`; }
  }

  throw new Error(lastError);
}

async function briefingsRoute(env) {
  try {
    const articles = await getOfficialArticles();
    const output = articles.map(article => {
      const clean = String(article.articleText || '').replace(/\s+/g, ' ').trim();
      const summary = String(article.summary || (clean.slice(0, 560).replace(/\s+\S*$/, '') + (clean.length > 560 ? '…' : ''))).trim();
      const { articleText, ...rest } = article;
      return { ...rest, summary, aiSummary: false };
    });
    return json({ success: output.length > 0, aiConfigured: Boolean(env.GEMINI_API_KEY || env.DEEPSEEK_API_KEY), sourcesChecked: 1, articlesFound: output.length, summariesGenerated: output.filter(x => x.summary).length, updatedAt: new Date().toISOString(), briefings: output });
  } catch (e) { console.error('[briefings]', errText(e)); return json({ success: false, error: 'Could not load official CODM briefings.', briefings: [] }, 502); }
}

async function getOfficialArticles() {
  // Only use article links whose visible headline is genuinely about COD Mobile.
  const listing = { name: 'Official CODM News', url: 'https://www.callofduty.com/blog/mobile', host: 'www.callofduty.com' };
  const candidates = new Map();
  try {
    const html = await fetchText(listing.url);
    const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(html))) {
      const link = articleUrl(m[1], listing);
      const title = textOf(m[2]);
      if (!link || title.length < 18 || title.length > 220) continue;
      if (!/(call of duty\s*:\s*mobile|call of duty mobile|cod mobile|\bcodm\b|mobile season|season \d+.*mobile)/i.test(title)) continue;
      if (/^(cod intel|news|blogs|guides|patch notes|call of duty mobile)$/i.test(title)) continue;
      if (!candidates.has(link)) candidates.set(link, { url: link, title, sourceName: 'Official CODM News' });
    }
  } catch (e) { console.warn('[briefings listing]', listing.url, errText(e)); }

  const picked = [...candidates.values()].slice(0, 8);
  const results = await Promise.all(picked.map(async item => {
    try {
      const html = await fetchText(item.url);
      const title = textOf(meta(html, ['og:title', 'twitter:title']) ||
        (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || item.title);
      const description = textOf(meta(html, ['og:description', 'description', 'twitter:description']));
      const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
      const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
      let rawBody = articleMatch?.[1] || mainMatch?.[1] || '';
      // Strip global navigation and page chrome before extracting prose.
      rawBody = rawBody
        .replace(/<(script|style|nav|header|footer|aside|form|noscript|svg|button)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<(div|section)[^>]*(?:class|id)=["'][^"']*(?:nav|menu|header|footer|breadcrumb|cookie|modal|social|related|recommend|login|signup)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, ' ');
      const paragraphs = [...rawBody.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(x => textOf(x[1]))
        .filter(x => x.length > 45 && !/^(games|news|blogs|guides|patch notes|login|sign up|profile|support|store|esports)\b/i.test(x));
      const body = paragraphs.join(' ').replace(/\s+/g, ' ').trim();
      const summary = description.length >= 40 ? description : body;
      // Never publish a page if it looks like navigation or has no meaningful article copy.
      if (title.length < 15 || summary.length < 40) return null;
      if (/^(cod intel|latest source snapshot|official codm news)$/i.test(title)) return null;
      const publishedAt = meta(html, ['article:published_time', 'datePublished', 'date', 'publish-date']) ||
        ((html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i) || [])[1] || '');
      const date = Date.parse(publishedAt);
      if (date && (date < Date.now() - 365 * 86400000 || date > Date.now() + 45 * 86400000)) return null;
      return { sourceName: 'Official CODM News', title: title.slice(0, 180), summary: summary.slice(0, 560), aiSummary: false, url: item.url, publishedAt: publishedAt.slice(0, 40) };
    } catch (e) { console.warn('[briefings article]', item.url, errText(e)); return null; }
  }));
  const unique = new Map();
  for (const article of results.filter(Boolean)) if (!unique.has(article.url)) unique.set(article.url, article);
  return [...unique.values()].sort((x, y) => (Date.parse(y.publishedAt) || 0) - (Date.parse(x.publishedAt) || 0)).slice(0, 8);
}
function articleUrl(href, source) {
  try {
    const u = new URL(decode(href), source.url);
    if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== source.host) return null;
    u.hash = '';
    if (/\.(png|jpe?g|gif|svg|webp|pdf|css|js|xml)(?:$|\?)/i.test(u.pathname)) return null;
    if (u.pathname.replace(/\/$/, '') === new URL(source.url).pathname.replace(/\/$/, '')) return null;
    if (!/\/blog\//i.test(u.pathname)) return null;
    if (!/call-of-duty-mobile|call-of-duty-mobile-season|cod-mobile|codm/i.test(u.href)) return null;
    return u.href.replace(/\/$/, '');
  } catch { return null; }
}
async function fetchText(url) {
  const r = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml,application/xml,text/xml;q=0.9,*/*;q=0.5', 'User-Agent': 'Mozilla/5.0 (compatible; CODMPanda/1.0)' }, signal: AbortSignal.timeout(5000), cf: { cacheTtl: 120, cacheEverything: true } });
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
