// CODMPanda Notification Worker
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const { tokens, title, body: msgBody, data } = body;

      if (!tokens || !tokens.length) {
        return new Response(JSON.stringify({ error: 'No tokens provided' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      let sa;
      try {
        sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Service account env not set or invalid JSON' }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      const accessToken = await getAccessToken(sa);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Failed to get access token' }), {
          status: 500,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
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
          const json = await res.json();
          results.push({ token: token.slice(0, 12) + '...', ok: res.ok, response: json });
        } catch (e) {
          results.push({ token: token.slice(0, 12) + '...', ok: false, error: e.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function getAccessToken(serviceAccount) {
  try {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
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
