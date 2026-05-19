# Render.com deployment — Game Reviews Hub

## Vite build output (frontend)

`artifacts/gamereviews/vite.config.ts` sets:

```ts
build.outDir → artifacts/gamereviews/dist/public
```

**Publish directory on Render Static Site:** `artifacts/gamereviews/dist/public`  
(not `dist` alone — the built `index.html` lives under `dist/public`)

---

## Database

From repo root (requires `DATABASE_URL` in `artifacts/api-server/.env` or env):

```bash
pnpm run db:push
```

Or:

```bash
pnpm --filter @workspace/db run push
```

Tables: `resenas`, `votos_utilidad`, `usuarios`, `respuestas`.

---

## Environment variables

### Backend (`artifacts/api-server` Web Service)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | HTTP port (Render sets this automatically) |
| `NODE_ENV` | Yes | Set to `production` on Render |
| `DATABASE_URL` | Yes | Neon/Postgres connection string |
| `JWT_SECRET` | Yes | Min 16 characters; signs auth cookies |
| `CORS_ORIGIN` | Recommended | Comma-separated allowed origins, e.g. `https://game-reviews-web.onrender.com` |
| `FRONTEND_URL` | Optional | Extra origin alias (same as CORS) |
| `RAWG_API_KEY` | Optional | Game images / agent |
| `ITAD_API_KEY` | Optional | Deals / price history |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Optional | AI streaming |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Optional | Custom Anthropic proxy URL |
| `LOG_LEVEL` | Optional | Pino log level (default `info`) |

`dotenv` loads `artifacts/api-server/.env` in development (`src/env.ts`).

### Frontend (Static Site)

| Variable | When | Description |
|----------|------|-------------|
| `VITE_API_ORIGIN` | Build time | API base URL, e.g. `https://game-reviews-hub-api.onrender.com` |

Set in `.render-build.sh` or Render build env.

---

## Root `npm install` on Render

The root `package.json` has **no dependencies** so Render’s automatic `npm install` succeeds.  
The real install/build uses **pnpm** via `.render-build.sh` (frontend) or the backend build command below.

`preinstall` runs `scripts/ensure-pnpm.mjs`, which **skips** the “use pnpm” check when `RENDER=true`.

---

## Render settings

### Backend — Web Service

| Setting | Value |
|---------|--------|
| **Root Directory** | *(repo root)* `.` |
| **Build Command** | `npm install -g pnpm@11.1.1 && pnpm install --ignore-scripts && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

**Environment:** `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN=https://game-reviews-web.onrender.com` (+ optional keys above).

### Frontend — Static Site

| Setting | Value |
|---------|--------|
| **Root Directory** | *(repo root)* `.` |
| **Build Command** | `bash .render-build.sh` |
| **Publish Directory** | `artifacts/gamereviews/dist/public` |

`VITE_API_ORIGIN` is set inside `.render-build.sh`.

---

## Manual steps after deploy

1. Create a **Neon** (or Render Postgres) database and set `DATABASE_URL` on the API service.
2. Run **`pnpm run db:push`** locally against that database (or use Drizzle from CI) to create tables.
3. Set **`JWT_SECRET`** (long random string) on the API service.
4. Set **`CORS_ORIGIN`** to your exact static site URL if it differs from `https://game-reviews-web.onrender.com`.
5. Redeploy the **frontend** after changing `VITE_API_ORIGIN` (it is baked in at build time).
6. Verify: open static site → register/login → post a review (cookies are `SameSite=None; Secure` in production).
