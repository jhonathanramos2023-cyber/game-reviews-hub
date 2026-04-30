# GameReviews

A Spanish-language dark-themed gaming community web app where players browse a curated catalog of games, write reviews, build a personal gaming list, see community rankings, and get AI-powered analysis from Claude.

## Architecture

This is a pnpm monorepo with two artifacts:

- `artifacts/gamereviews` — React + Vite frontend (the actual app)
- `artifacts/api-server` — Express server that proxies AI streaming requests to Anthropic Claude

All user data (profile, game list, reviews, votes) is persisted in browser **localStorage**. Game catalog is a static JSON file. The backend proxies Anthropic AI streaming, RAWG image lookups, ITAD deal prices, and runs an autonomous AI agent that updates the catalog daily.

### Workflows

- `artifacts/api-server: API Server` — runs the Express server (port 8080, mounted at `/api`)
- `artifacts/gamereviews: web` — runs the Vite dev server (mounted at `/`)

## Frontend (`artifacts/gamereviews`)

### Routes (wouter)
- `/` — Home: hero, search, filters (genre/platform/sort/rating slider), catalog grid
- `/juego/:id` — Game detail: hero banner, cover, info, trailer, AI analysis, skins/DLCs, reviews, similar games
- `/ranking` — Top games tabs (best rated, most reviewed, trending) + AI ranking analysis
- `/mi-lista` — Personal tracker with status tabs (Quiero Jugar / Jugando / Completados / Abandonados) + AI recommendations
- `/perfil` — Profile with editable name/bio/avatar color, favorite genres, user reviews, data export, clear data

### Key files
- `src/data/games.json` — 32 games with full schema (id, nombre, generos, plataformas, ratingMetacritic, video, skins, packs, etc.)
- `src/lib/ai.ts` — `streamAi(system, prompt, handlers)` SSE client wrapper
- `src/components/game-image.tsx` — Image with gradient/title fallback when src 404s
- `src/components/ai-analysis.tsx` — Reusable streaming AI section
- `src/hooks/use-user.ts`, `use-list.ts`, `use-reviews.ts`, `use-local-storage.ts` — localStorage-backed hooks

### localStorage keys
- `gr_usuario` — `{ nombre, bio, avatarColor, fechaRegistro }`
- `gr_lista` — `[{ juegoId, estado, horasJugadas, ratingPersonal, notaPersonal, fechaAgregado }]`
- `gr_resenas` — `[{ id, juegoId, autor, rating, texto, recomendado, fecha, utilidad, esPropia }]`
- `gr_votos` — `[reviewId, ...]`

### Design
- Dark mode default (`document.documentElement.classList.add('dark')` in `main.tsx`)
- Purple/violet primary, gold accents
- Fonts: Orbitron (700/900) for display, Space Grotesk for body — loaded via `<link>` in `index.html`
- framer-motion for animations, sonner for toasts, recharts available, lucide-react for icons (no emojis)

## Backend (`artifacts/api-server`)

- Express + drizzle-orm scaffold (DB scaffold present but unused — no migrations needed)
- `POST /api/ai/stream` — SSE endpoint accepting `{ system, prompt }` and streaming Anthropic Claude `claude-sonnet-4-6` deltas as `data: {"content":"..."}` events, ending with `data: {"done":true}`
- `GET /api/agente/status` — returns agent status, last/next run times, 7-day stats, last 50 log lines
- `POST /api/agente/run` — triggers a manual agent run (fetches RAWG trending → Claude curation → JSON update)
- `GET /api/agente/juegos` — all agent-added games + last-24h subset
- `GET /api/agente/noticias` — today's AI-generated news items
- `GET /api/healthz` — health check

### Autonomous AI Agent (`artifacts/api-server/src/agent/`)
- `agente.ts` — core logic: fetches RAWG trending, calls Claude Sonnet to curate 3 games and generate Spanish descriptions + news, writes to `data/juegos-agente.json` and `data/noticias.json`, appends to `logs/agente.log`
- `agenteCron.ts` — schedules the agent to run every day at 6am UTC using node-cron

The AI client lives in `lib/integrations-anthropic-ai/` and is exposed as `@workspace/integrations-anthropic-ai`. It reads `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY` from the environment (set by the Anthropic Replit integration).

## Notable conventions
- The frontend talks to the backend via `${import.meta.env.BASE_URL}/api/...` because both artifacts are routed through the shared Replit proxy on path-based routing.
- The AI streaming endpoint is **not** in the OpenAPI spec (SSE doesn't codegen); the frontend uses plain `fetch` for it.
- Image URLs in `games.json` that 404 are gracefully replaced by a generated gradient placeholder with the game name.
