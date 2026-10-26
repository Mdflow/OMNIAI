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
  `node_modules/.bin/tsx server.ts`, i.e. the same thing `npm run dev` does. Do not run
  it as `bun run dev`: that executes tsx on bun's runtime rather than Node's.
- Vite is mounted in middleware mode on the project's own HTTP server, so the SPA shell
  served at `/` is live source (`/@vite/client`, `/@react-refresh`), never a built bundle.

## Verifying it works

- `curl -s http://localhost:3000/health` → `{"status":"ok","hasApiKey":<bool>,...}`
  (the same handler is also at `/api/health`).
- `curl -s http://localhost:3000/models` → the model catalogue.
- The UI entry point is `GET /`. A 200 from `/health` alone does not prove the
  frontend compiled — check `/` as well; the compose healthcheck probes both.
- Type check: `docker compose -f docker-compose.base44.yml exec -T web node_modules/.bin/tsc --noEmit`
  (`npm run lint` runs the same thing). This repo has no test suite.
- The HMR websocket is served on port 3000 by the same Express server
  (`ws://127.0.0.1:3000/`, subprotocol `vite-hmr` — answers when probed from inside the
  container). If an edit does not show up in the preview, force a full reload.

## Environment and secrets

- `GEMINI_API_KEY` is the only external credential. It is delivered by the platform
  to `/run/base44/app.env`, wired in with `env_file:` — never under compose
  `environment:` (that would permanently outrank a later dashboard value) and never
  committed.
- The server starts without a valid key (`@google/genai` logs "API key should be set"
  when the value is empty); `/health` then reports `hasApiKey: false` and a chat request
  fails with a readable message in the thread. The `/proxy/browse` and `/proxy/extract`
  endpoints work regardless of the key.
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
- The preview proxy host allowlist is handled entirely by the bare
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` entry in compose (Vite >= 6.1 appends it to
  `server.allowedHosts`), so no host config edit is needed.
- `server.hmr = { server: httpServer }` in `server.ts` is deprecated in Vite 8 and logs
  a warning at boot; it still works (the websocket above answers).
