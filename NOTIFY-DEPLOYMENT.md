# CODMPanda Notify — production setup

Use the repository's **main** branch and the root files `worker.js` and `wrangler.toml`.

Do not deploy the experimental `codmpanda-notify-clean` branch or a nested copy. The existing production Worker name remains `codmpanda-notify`.

## Cloudflare build settings
For the `codmpanda-notify` Worker, set the deployment command to:

    npx wrangler deploy

Do not use `npx wrangler preview` for production deployment; it requires preview-specific configuration and is not the deployment command we want.

## Secrets
In Cloudflare Dashboard → Workers & Pages → `codmpanda-notify` → Settings → Variables and Secrets, configure:

- `GEMINI_API_KEY`: your Gemini API key, stored as a secret.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the complete Firebase service-account JSON contents, stored as a secret.
- Optional `OPENAI_API_KEY` only if you intend to use OpenAI instead of Gemini.

Secrets are scoped to a particular Worker/environment. A key configured for Pages or a different Worker is not automatically available to `codmpanda-notify`. Do not put key values in GitHub or send them in chat.

## Health check
After deployment, open the deployed Worker URL with `/health`. Expected fields include:
- `status: "ok"`
- `service: "codmpanda-notify"`
- `build: "codmpanda-main-v10"`
- `aiConfigured: true`
- `serviceAccountConfigured: true`

These flags only confirm that secrets are present, not that external APIs are fully working. Test Coach and Intel summaries before changing the frontend endpoint.
