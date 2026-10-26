# CODMPanda Notify — clean Worker setup

Deploy only from the repository's `main` branch using the root `worker.js` and `wrangler.toml`.

## Cloudflare build settings

Use this production deploy command:

    npx wrangler deploy

## Required Worker secrets

In Cloudflare → Workers & Pages → `codmpanda-notify` → Settings → Variables and Secrets, configure these as secrets:

- `GEMINI_API_KEY` — Gemini API key.
- `FIREBASE_SERVICE_ACCOUNT_JSON` — complete Firebase service-account JSON.

Never commit secret values to GitHub or paste them into chat. Secrets must be attached to the `codmpanda-notify` Worker itself.

## Verify after deployment

Open the Worker URL followed by `/health`. Expected values:

- `status: "ok"`
- `service: "codmpanda-notify"`
- `build: "codmpanda-worker-v1"`
- `aiConfigured: true`
- `serviceAccountConfigured: true`

The health check only confirms the secrets are present. Then test `POST /coach`, `GET /briefings`, and push notifications to verify the external APIs work.
