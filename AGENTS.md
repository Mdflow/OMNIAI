# AGENTS.md

Working notes for this repo inside the Base44 sandbox.

## What this project is

One Node process. `server.ts` starts Express on `PORT` (3000), binds `0.0.0.0`, and
mounts Vite in middleware mode. The React SPA (`index.html` + `src/`) and the API
routes (`api-routes.ts`) are therefore served from a **single origin on port 3000** —
there is no separate frontend and backend service to wire together.

## Running it here

```bash
docker compose -f docker-compose.base44.yml up -d --build
docker compose -f docker-compose.base44.yml logs -f web
```

- The image is built from `Dockerfile.base44` (`node:22` + the bun package manager).
  It copies **no** application source: compose bind-mounts the checkout at `/app`, so
  edits appear without rebuilding.
- **The app runs on Node, the dependency manager is bun.** `bun.lock` is the lockfile
  and there is no `package-lock.json`, so do not run `npm install` — it would resolve
  fresh versions instead of the locked ones. Dependencies are installed on container
  startup (`bun install --frozen-lockfile`) and the app is started with
  `node_modules/.bin/tsx watch server.ts`, i.e. the repo's own `npm run dev` plus a
  watcher (used here so backend edits reload the process). Do not run it as
  `bun run dev`: that executes tsx on bun's runtime rather than Node's.
- Vite is mounted in middleware mode on the project's own HTTP server, so the SPA shell
  served at `/` is live source (`/@vite/client`, `/@react-refresh`), never a built bundle.

## Verifying it works

- `curl -s http://localhost:3000/health` → `{"status":"ok","hasApiKey":<bool>,"model":"<default model>"}`
  (the same handler is also at `/api/health`).
- `curl -s http://localhost:3000/models` → the models offered in the picker, i.e.
  `AI_MODEL` first followed by `AI_MODELS`.
- The UI entry point is `GET /`. A 200 from `/health` alone does not prove the
  frontend compiled — check `/` as well; the compose healthcheck probes both.
- Type check: `docker compose -f docker-compose.base44.yml exec -T web node_modules/.bin/tsc --noEmit`
  (`npm run lint` runs the same thing). This repo has no test suite.
- The chat plumbing (streaming, model resolution, provider error surfacing) can be
  verified without a real key: run the app in a throwaway container with
  `AI_API_KEY=test-key` and `AI_BASE_URL=http://127.0.0.1:4545/v1`, alongside a tiny
  local server that answers `POST /v1/chat/completions` with `data: {"choices":[{"delta":{"content":"..."}}]}\n\n`
  frames followed by `data: [DONE]`. `/api/chat/stream` should emit `data: {"text":"..."}`
  per frame and end.
- The HMR websocket is served on port 3000 by the same Express server
  (`ws://127.0.0.1:3000/`, subprotocol `vite-hmr` — answers when probed from inside the
  container). If an edit does not show up in the preview, force a full reload.

## Environment and secrets

- The AI backend is **provider-agnostic**: chat requests are sent to
  `${AI_BASE_URL}/chat/completions` with a bearer token, so any OpenAI-compatible
  provider works (OpenAI, OpenRouter, Groq, Together, DeepSeek, xAI, Mistral,
  Ollama/LM Studio, Google's OpenAI-compatible endpoint, ...).
  - `AI_API_KEY` — the provider key. Without it the app still runs: `/health` reports
    `hasApiKey: false` and a chat request fails with a readable message in the thread.
  - `AI_BASE_URL` — optional, defaults to `https://api.openai.com/v1` (trailing slash
    is trimmed).
  - `AI_MODEL` — optional, defaults to `gpt-4o-mini`; also the fallback when the client
    sends a model id the server does not know.
  - `AI_MODELS` — optional comma-separated extra model ids for the picker; `AI_MODEL` is
    always listed first and badged "Default".
  - These are delivered by the platform to `/run/base44/app.env` and wired in with
    `env_file:`. Never put them under compose `environment:` (that would permanently
    outrank a later dashboard value) and never commit them.
- Do **not** create a repo-root `.env`: `server.ts` and `api-routes.ts` call
  `dotenv.config()`, so a stray file would silently shadow the platform secrets.
- `netlify.toml` and `netlify/functions/api.ts` exist for Netlify deployment
  (`serverless-http`); they are unused in the sandbox.

## Quirks

- **Client-disconnect detection in `/chat/stream` must watch the response, not the
  request.** Since Node 16 the request's own `close` event fires as soon as the request
  body has been read, so `req.on('close')` marks *every* request as aborted: the stream
  then sends nothing, never ends, and the UI spins forever. The handler uses
  `res.on('close')` with a `res.writableEnded` guard — keep it that way.
- The composer's **Search toggle is no longer wired to a provider tool**: Gemini's
  `googleSearch` tool had no portable OpenAI-compatible equivalent, so the flag is
  accepted and ignored. Re-introducing it means choosing a provider-specific mechanism
  (e.g. OpenRouter's `:online` model suffix, or OpenAI's `web_search` tool).
- The preview proxy host allowlist is handled entirely by the bare
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` entry in compose (Vite >= 6.1 appends it to
  `server.allowedHosts`), so no host config edit is needed.
- `server.hmr = { server: httpServer }` in `server.ts` is deprecated in Vite 8 and logs
  a warning at boot; it still works (the websocket above answers).
