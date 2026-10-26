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

- Base image is `oven/bun:1`; the checkout is bind-mounted at `/app`, so edits
  appear without a rebuild.
- **The package manager is bun.** `bun.lock` is the lockfile and there is no
  `package-lock.json`, so do not run `npm install` — it would resolve fresh
  versions instead of the locked ones.
- Dependencies are installed on container startup from that lockfile
  (`bun install --frozen-lockfile`), then the app starts with
  `bun run dev` (= `tsx server.ts`).

## Verifying it works

- `curl -s http://localhost:3000/health` → `{"status":"ok","hasApiKey":<bool>,...}`
  (the same handler is also at `/api/health`).
- `curl -s http://localhost:3000/models` → the model catalogue.
- The UI entry point is `GET /`. A 200 from `/health` alone does not prove the
  frontend compiled — check `/` as well; the compose healthcheck probes both.
- Type check: `docker compose -f docker-compose.base44.yml exec -T web bun run lint`
  (`tsc --noEmit`). This repo has no test suite.

## Environment and secrets

- `GEMINI_API_KEY` is the only external credential. It is delivered by the platform
  to `/run/base44/app.env`, wired in with `env_file:` — never under compose
  `environment:` (that would permanently outrank a later dashboard value) and never
  committed.
- The server starts without the key (`@google/genai` logs "API key should be set"
  at boot); `/health` then reports `hasApiKey: false` and `POST /api/chat/stream`
  returns 500 with a message pointing at the key. The proxy/browse endpoints work
  regardless.
- Do **not** create a repo-root `.env`: `server.ts` and `api-routes.ts` call
  `dotenv.config()`, so a stray file would silently shadow the platform secrets.
- `netlify.toml` and `netlify/functions/api.ts` exist for Netlify deployment
  (`serverless-http`); they are unused in the sandbox.

## Quirks

- The preview proxy host allowlist is handled entirely by the bare
  `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` entry in compose (Vite >= 6.1 appends it
  to `server.allowedHosts`), so no host config edit is needed.
- `server.hmr = { server: httpServer }` in `server.ts` is deprecated in Vite 8 and
  logs a warning at boot; the HMR websocket is still served by the same Express
  server.
