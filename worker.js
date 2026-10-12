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

    if (url.pathname === '/health') {
      return json({
        status: 'ok',
        serviceAccountConfigured: !!env.FIREBASE_SERVICE_ACCOUNT_JSON
      });
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

// ============================================
// JSON RESPONSE HELPER
// ============================================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
