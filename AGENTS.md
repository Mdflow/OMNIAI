# OmniChat — Base44 dev notes

A single-process app: `server.ts` (run via the repo's `dev` script = `tsx server.ts`) hosts the
Express API routes (`/api/*`) and mounts Vite's dev server in middleware mode, so one origin on
host port 3000 serves both the SPA and the API.

## Running it

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Image: `oven/bun:1`. The project pins `bun.lock`, so `bun install --frozen-lockfile` runs at
  startup and `bun run dev` starts the server. `tsx` works under Bun here.
- Source is bind-mounted at `/app`; `node_modules` lives on that mount. Live reload is Vite's,
  served through the same Express server (no second origin to expose).
- Health: `GET /api/health` returns `{ status: "ok", hasApiKey }`. The compose healthcheck also
  fetches `/` so the web UI is covered.

## Sandbox-specific wiring (only active in the Base44 preview)

- `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` (provided by the sandbox) is forwarded into the
  container. Vite's dev server otherwise rejects the preview proxy's `Host` header with a 403 on
  the page (the `/api/*` routes still work) — forwarding it lets Vite append the sandbox host to
  `allowedHosts`. No change is made to `vite.config.ts`.
- `BASE44_PREVIEW_MODE` is passed through unchanged; the app does not gate behavior on it.

## Credentials

- `GEMINI_API_KEY` (Google AI Studio, https://aistudio.google.com/app/apikey) is the only external
  credential. It is **not** required to boot — `GoogleGenAI` only warns with an empty key — but
  every chat reply fails with a clear "GEMINI_API_KEY is missing" message until it is set. It is
  delivered through the platform secrets file and wired via `env_file` (last, so it wins).

## Verifying a change

- `curl http://localhost:3000/api/health` → 200 JSON.
- Load `/` in the preview; the SPA renders the chat UI.
- Chat (`POST /api/chat/stream`) returns a streamed SSE response once `GEMINI_API_KEY` is set.
- The in-app browser uses `/api/proxy/browse?url=…` (server-side fetch + cheerio rewrite); it
  needs outbound network from the container.
