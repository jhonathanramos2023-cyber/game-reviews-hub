# Game Reviews Hub — Documentación técnica

Documentación profesional del proyecto **Game Reviews Hub**: plataforma web en español para descubrir videojuegos, leer y escribir reseñas, comparar precios y obtener análisis asistidos por IA.

---

## Tabla de contenidos

1. [Descripción del proyecto](#1-descripción-del-proyecto)
2. [Tecnologías y por qué se eligieron](#2-tecnologías-y-por-qué-se-eligieron)
3. [Base de datos completa](#3-base-de-datos-completa)
4. [APIs externas usadas](#4-apis-externas-usadas)
5. [API interna — todos los endpoints](#5-api-interna--todos-los-endpoints)
6. [Módulos del frontend](#6-módulos-del-frontend)
7. [Sistema de autenticación](#7-sistema-de-autenticación)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Cómo correr el proyecto localmente](#9-cómo-correr-el-proyecto-localmente)
10. [Cómo está deployado en producción](#10-cómo-está-deployado-en-producción)
11. [Estructura de carpetas](#11-estructura-de-carpetas)

---

## 1. Descripción del proyecto

### Qué es

**Game Reviews Hub** es una aplicación full-stack de comunidad gaming orientada al público hispanohablante. Combina un catálogo curado de juegos, reseñas de usuarios persistidas en PostgreSQL, integración de precios y ofertas, imágenes de alta calidad y un agente autónomo que actualiza novedades diariamente usando RAWG y Claude (Anthropic).

### Para qué sirve

| Funcionalidad | Descripción |
|---------------|-------------|
| Catálogo | Explorar juegos con filtros por género, plataforma, rating y búsqueda |
| Reseñas | Publicar, editar, eliminar y votar reseñas (backend + BD) |
| Mi lista | Seguimiento personal del estado de juegos (localStorage) |
| Ranking | Top por rating, reseñas y tendencias + análisis IA |
| Precios | Ofertas multi-tienda vía IsThereAnyDeal (ITAD) |
| IA | Streaming de análisis con Claude Sonnet 4.6 |
| Agente | Curación automática de juegos trending y noticias (cron 6:00 UTC) |

### Público objetivo

- Jugadores de PC y consola en Latinoamérica y España que buscan opiniones en español.
- Usuarios que quieren comparar precios antes de comprar.
- Comunidad que valora reseñas, rankings y recomendaciones personalizadas.
- Administradores que monitorizan el agente IA desde `/admin`.

### Arquitectura de datos (híbrida)

| Dato | Almacenamiento |
|------|----------------|
| Usuarios y contraseñas | PostgreSQL (`usuarios`) |
| Reseñas, votos, respuestas | PostgreSQL |
| Catálogo principal | `artifacts/gamereviews/src/data/games.json` |
| Juegos/noticias del agente | JSON en servidor (`juegos-agente.json`, `noticias.json`) |
| Mi lista, perfil local, plan | `localStorage` del navegador |

---

## 2. Tecnologías y por qué se eligieron

### Monorepo: pnpm workspaces

**Qué es:** Gestión de múltiples paquetes (`artifacts/*`, `lib/*`) desde la raíz.

**Por qué:** Separa frontend, API y librerías compartidas (DB, Zod, cliente API) con instalación y builds coordinados. **Alternativa descartada:** repos separados — más fricción para tipos compartidos y despliegue.

### Frontend: React 19 + Vite 7 + TypeScript

**Por qué:** Ecosistema maduro, HMR rápido, build optimizado para static hosting en Render. **Alternativa:** Next.js — innecesario para SPA con API externa y aumenta complejidad de despliegue.

### Enrutamiento: Wouter

**Por qué:** Router ligero (~3 KB) suficiente para SPA sin SSR. **Alternativa:** React Router — más pesado para el alcance del proyecto.

### UI: Tailwind CSS 4 + Radix UI + shadcn-style

**Por qué:** Tema oscuro gaming, componentes accesibles, desarrollo rápido. **Alternativa:** MUI — estética menos personalizable para marca “gaming”.

### Estado servidor: TanStack Query v5

**Por qué:** Cache, reintentos y sincronización de reseñas/auth sin boilerplate. **Alternativa:** Redux — excesivo para fetch REST.

### Backend: Express 5 + Node.js (ESM)

**Por qué:** API REST simple, middleware estándar (CORS, cookies, JSON), fácil de desplegar en Render Web Service. **Alternativa:** Fastify — viable, pero Express cubre todas las necesidades actuales.

### ORM: Drizzle ORM + drizzle-kit

**Por qué:** Schema TypeScript-first, `push` sin migraciones SQL manuales para prototipos/producción Neon. **Alternativa:** Prisma — más pesado; TypeORM — API más verbosa.

### Base de datos: PostgreSQL (Neon en producción)

Ver sección 3.

### Autenticación: JWT + cookies httpOnly + bcrypt

Ver sección 7.

### IA: Anthropic SDK (`claude-sonnet-4-6`)

**Por qué:** Calidad en español para reseñas, rankings y agente. **Alternativa:** OpenAI — el proyecto ya integra Anthropic vía `@workspace/integrations-anthropic-ai`.

### Logging: Pino + pino-http

**Por qué:** JSON estructurado en producción, bajo overhead. **Alternativa:** Winston — más verboso de configurar.

### Validación API: Zod (drizzle-zod + api-zod generado)

**Por qué:** Tipos compartidos entre OpenAPI y handlers. El health check usa `HealthCheckResponse` generado.

### Build API: esbuild

**Por qué:** Bundle rápido del servidor a `dist/index.mjs`. **Alternativa:** tsc solo — no empaqueta dependencias workspace igual de simple.

---

## 3. Base de datos completa

### Por qué PostgreSQL y no MySQL u otra

| Criterio | PostgreSQL | MySQL / SQLite / MongoDB |
|----------|------------|---------------------------|
| Tipos | `timestamp with time zone`, `boolean`, `text` nativos | SQLite limitado en producción multi-usuario |
| Hosting | Neon ofrece serverless Postgres con SSL y branching | MongoDB sobredimensionado para relaciones simples |
| Drizzle | Soporte first-class `pg-core` | MySQL posible pero el proyecto ya usa `drizzle-orm/pg-core` |
| Integridad | PK compuesta en `votos_utilidad`, FK en scaffold `messages` | Document stores sin joins naturales para reseñas |

**Neon** se usa en producción por: conexión serverless, `sslmode=require`, plan gratuito generoso y compatibilidad directa con `DATABASE_URL` de Render.

### Tablas en uso (producción)

Definidas en `lib/db/src/schema/` y aplicadas con `pnpm run db:push`.

#### Tabla `usuarios`

| Columna (SQL) | Tipo Drizzle | Restricciones | Descripción |
|---------------|--------------|---------------|-------------|
| `id` | `text` | PRIMARY KEY | ID hex de 24 caracteres (`randomBytes(12)`) |
| `nombre` | `text` | NOT NULL | Nombre visible (máx. 80 en API) |
| `email` | `text` | NOT NULL, UNIQUE | Email normalizado a minúsculas |
| `password_hash` | `text` | NOT NULL | Hash bcrypt (12 rondas) |
| `avatar_url` | `text` | nullable | Color hex aleatorio al registrarse |
| `fecha_registro` | `timestamp with time zone` | NOT NULL, DEFAULT now() | Alta del usuario |
| `rol` | `text` | NOT NULL, DEFAULT `'user'` | `user` o `admin` |

#### Tabla `resenas`

| Columna (SQL) | Tipo Drizzle | Restricciones | Descripción |
|---------------|--------------|---------------|-------------|
| `id` | `text` | PRIMARY KEY | ID hex (12 caracteres) |
| `juego_id` | `integer` | NOT NULL | ID del juego en `games.json` |
| `juego_nombre` | `text` | NOT NULL | Nombre al crear la reseña |
| `autor` | `text` | NOT NULL | `nombre` del JWT (no email) |
| `rating` | `integer` | NOT NULL | 1–5 |
| `texto` | `text` | NOT NULL | Mín. 10 caracteres en API |
| `recomendado` | `boolean` | NOT NULL, DEFAULT true | ¿Recomienda el juego? |
| `fecha` | `timestamptz` | NOT NULL, DEFAULT now() | Fecha de publicación |
| `utilidad` | `integer` | NOT NULL, DEFAULT 0 | Contador de votos “útil” |
| `plataforma` | `text` | NOT NULL, DEFAULT `'PC'` | Plataforma del reseñador |

#### Tabla `votos_utilidad`

| Columna (SQL) | Tipo Drizzle | Restricciones | Descripción |
|---------------|--------------|---------------|-------------|
| `resena_id` | `text` | NOT NULL, PK compuesta | FK lógica a `resenas.id` |
| `usuario_hash` | `text` | NOT NULL, PK compuesta | Identificador anónimo del votante (frontend) |

**Clave primaria compuesta:** `(resena_id, usuario_hash)` — evita votos duplicados.

#### Tabla `respuestas`

| Columna (SQL) | Tipo Drizzle | Restricciones | Descripción |
|---------------|--------------|---------------|-------------|
| `id` | `text` | PRIMARY KEY | ID hex |
| `resena_id` | `text` | NOT NULL | Reseña padre |
| `autor` | `text` | NOT NULL | Nombre del usuario autenticado |
| `texto` | `text` | NOT NULL | Mín. 2 caracteres en API |
| `fecha` | `timestamptz` | NOT NULL, DEFAULT now() | Fecha de la respuesta |

### Tablas scaffold (no exportadas en `schema/index.ts`)

Presentes en el repo para futuras features de chat; **no se usan** en la API actual:

#### `conversations`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `serial` | PRIMARY KEY |
| `title` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() |

#### `messages`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `serial` | PRIMARY KEY |
| `conversation_id` | `integer` | NOT NULL, FK → `conversations.id` ON DELETE CASCADE |
| `role` | `text` | NOT NULL |
| `content` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() |

### Diagrama de relaciones

```mermaid
erDiagram
    usuarios ||--o{ resenas : "autor por nombre"
    resenas ||--o{ respuestas : "resena_id"
    resenas ||--o{ votos_utilidad : "resena_id"
```

> **Nota:** `resenas.autor` es texto, no FK a `usuarios.id`. La autorización compara `req.auth.nombre` con `resenas.autor`.

### Aplicar schema

```bash
# Desde la raíz, con DATABASE_URL configurada
pnpm run db:push
```

---

## 4. APIs externas usadas

### Steam CDN (Cloudflare)

**Qué hace:** Sirve assets públicos de la tienda Steam (portadas, banners, capturas) **sin API key**.

**Formato de URL:**

```
https://cdn.cloudflare.steamstatic.com/steam/apps/{STEAM_APP_ID}/library_600x900.jpg  # cover vertical
https://cdn.cloudflare.steamstatic.com/steam/apps/{STEAM_APP_ID}/header.jpg         # banner horizontal
https://cdn.cloudflare.steamstatic.com/steam/apps/{STEAM_APP_ID}/ss_1.jpg           # screenshot 1
```

**Uso en el proyecto:** Campo `steamId` en `games.json` → URLs `imagen` / `imagenBanner` precalculadas. Enlace tienda: `https://store.steampowered.com/app/{STEAM_APP_ID}/`.

**Por qué:** Imágenes oficiales de alta calidad, CDN global, cero coste y sin rate limits de API. **Alternativa:** solo RAWG — menos consistente para juegos multiplataforma con listing en Steam.

### RAWG API

**Base:** `https://api.rawg.io/api`

| Uso | Endpoint | Método | Qué retorna |
|-----|----------|--------|-------------|
| Imágenes fallback | `/games?search={q}&page_size=8&key={key}` | GET | `results[]` con `background_image`, `short_screenshots`, `rating`, `metacritic` |
| Agente trending | `/games?ordering=-added&dates={ayer},{hoy}&page_size=20&key={key}` | GET | Juegos añadidos recientemente en RAWG |

**Proxy interno:** `GET /api/imagen/:nombre?slug=...` — busca la mejor coincidencia y devuelve URLs de imagen.

**Por qué:** Base de 500k+ juegos, plan gratuito con registro. **Alternativa:** IGDB — requiere Twitch OAuth; más complejo.

### IsThereAnyDeal (ITAD)

**Base:** `https://api.isthereanydeal.com`  
**Autenticación:** query param `key={ITAD_API_KEY}`

| Endpoint ITAD | Uso en proyecto | Retorno |
|---------------|-----------------|---------|
| `GET /deals/v2` | Top ofertas (`/api/deals/top/ofertas`) | `list[]` con deals, descuentos, tiendas |
| `GET /games/search/v1` | Buscar juego por título | `[{ id, title }]` |
| `POST /games/prices/v2` | Precios actuales por ID | `[{ id, deals[] }]` con shop, price, regular, url |
| `POST /games/historylow/v1` | Mínimo histórico | `[{ id, low }]` |
| `POST /games/history/v2` | Historial 1 año | `[{ id, history[] }]` |

**Proxy interno:**

- `GET /api/deals/:slug` — precios por nombre de juego
- `GET /api/deals/top/ofertas` — carousel de ofertas
- `GET /api/deals/history/:gameId` — historial (ID ITAD)

**Por qué:** Agregador multi-tienda (Steam, GOG, Epic, etc.). **Alternativa:** APIs por tienda — fragmentado y más mantenimiento.

### Anthropic API (Claude)

**Cliente:** `@anthropic-ai/sdk` en `lib/integrations-anthropic-ai`

| Uso | Modelo | Endpoint interno |
|-----|--------|------------------|
| Streaming UI | `claude-sonnet-4-6` | `POST /api/ai/stream` (SSE) |
| Agente batch | `claude-sonnet-4-6` | `runAgente()` en `agente.ts` |

**Variables:** `AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` (proxy Replit opcional).

### Otras fuentes (sin API propia)

| Fuente | Uso |
|--------|-----|
| YouTube | URLs embebidas en `games.json` (`video`) |
| PlayStation CDN | Algunas imágenes de skins/DLC |
| Wikipedia / media RAWG | Fallback cuando `steamId` es `null` |

---

## 5. API interna — todos los endpoints

**Base URL producción:** `https://game-reviews-hub-api.onrender.com`  
**Prefijo:** todas las rutas bajo `/api`  
**CORS:** `credentials: true` — el frontend envía cookies con `credentials: "include"`.

### Autenticación en endpoints

| Símbolo | Significado |
|---------|-------------|
| 🔓 | Público |
| 🍪 | Cookie `gr_token` o header `Authorization: Bearer {jwt}` |
| 🔐 | Requiere sesión válida |
| 👑 | Requiere `rol === "admin"` (solo lógica de borrado de reseña ajena) |

---

### Health

#### `GET /api/healthz` 🔓

**Response 200:**

```json
{ "status": "ok" }
```

**Ejemplo:**

```bash
curl https://game-reviews-hub-api.onrender.com/api/healthz
```

---

### Autenticación

#### `POST /api/auth/register` 🔓

**Body:**

```json
{
  "nombre": "Ana Gamer",
  "email": "ana@ejemplo.com",
  "password": "secreto123",
  "rememberMe": false
}
```

**Response 200:** Set-Cookie `gr_token` + body:

```json
{
  "success": true,
  "user": {
    "id": "a1b2c3...",
    "nombre": "Ana Gamer",
    "email": "ana@ejemplo.com",
    "avatarUrl": "#8B5CF6",
    "fechaRegistro": "2026-05-20T12:00:00.000Z",
    "rol": "user"
  }
}
```

**Errores:** `400` validación, `409` email duplicado.

#### `POST /api/auth/login` 🔓

**Body:**

```json
{
  "email": "ana@ejemplo.com",
  "password": "secreto123",
  "rememberMe": true
}
```

**Response:** Igual que register (`success`, `user` + cookie).

**Errores:** `400`, `401` credenciales incorrectas.

#### `POST /api/auth/logout` 🔓

**Response 200:**

```json
{ "success": true }
```

Limpia cookie `gr_token`.

#### `GET /api/auth/me` 🔐

**Response 200:**

```json
{
  "user": {
    "id": "...",
    "nombre": "Ana Gamer",
    "email": "ana@ejemplo.com",
    "avatarUrl": "#8B5CF6",
    "fechaRegistro": "...",
    "rol": "user"
  }
}
```

**Errores:** `401` sin sesión o usuario borrado.

---

### Reseñas

#### `GET /api/resenas` 🔓 (optionalAuth)

**Response 200:**

```json
{
  "resenas": [
    {
      "id": "abc123",
      "juegoId": 1,
      "juegoNombre": "God of War Ragnarök",
      "autor": "Ana Gamer",
      "rating": 5,
      "texto": "Una obra maestra...",
      "recomendado": true,
      "fecha": "2026-05-20T10:00:00.000Z",
      "utilidad": 3,
      "plataforma": "PS5",
      "respuestaCount": 1,
      "respuestas": [{ "id": "...", "resenaId": "...", "autor": "...", "texto": "...", "fecha": "..." }]
    }
  ]
}
```

(Límite interno: 200 reseñas más recientes.)

#### `GET /api/resenas/:juegoId` 🔓

**Response:** `{ "resenas": [...] }` filtradas por `juegoId`.

#### `GET /api/resenas/usuario/me` 🔐

**Response:** Reseñas donde `autor === nombre` del JWT.

#### `POST /api/resenas` 🔐  
#### `POST /api/reviews` 🔐 (alias)

**Body:**

```json
{
  "juegoId": 1,
  "juegoNombre": "God of War Ragnarök",
  "rating": 5,
  "texto": "Increíble narrativa y combate.",
  "recomendado": true,
  "plataforma": "PS5"
}
```

**Response 200:**

```json
{ "success": true, "id": "a1b2c3" }
```

#### `PUT /api/resenas/:id` 🔐

**Body (parcial):** `texto`, `rating`, `recomendado`, `plataforma`  
**Response:** `{ "success": true }` — solo el autor.

#### `DELETE /api/resenas/:id` 🔐

**Response:** `{ "success": true }` — autor o admin.

#### `POST /api/resenas/:id/utilidad` 🔓

**Body:**

```json
{ "usuarioHash": "anon-hash-xyz" }
```

**Response 200:** `{ "success": true }`  
**Error 400:** ya votó.

---

### Respuestas a reseñas

#### `POST /api/resenas/:id/respuestas` 🔐

**Body:**

```json
{ "texto": "Totalmente de acuerdo contigo." }
```

**Response 200:**

```json
{
  "success": true,
  "respuesta": {
    "id": "...",
    "resenaId": "...",
    "autor": "Ana Gamer",
    "texto": "...",
    "fecha": "..."
  }
}
```

#### `DELETE /api/respuestas/:id` 🔐

Autor o admin. **Response:** `{ "success": true }`.

---

### Estadísticas

#### `GET /api/stats/juego/:juegoId` 🔓

```json
{
  "totalResenas": 12,
  "ratingPromedio": 4.5,
  "totalRecomendados": 10
}
```

#### `GET /api/stats/online` 🔓

Contador simulado según hora UTC (UX social).

```json
{ "count": 142 }
```

---

### Imágenes (RAWG proxy)

#### `GET /api/imagen/:nombre?slug=god-of-war-ragnarok` 🔓

**Response 200:**

```json
{
  "imagen": "https://media.rawg.io/...",
  "imagenAdicional": "https://...",
  "rating": 4.5,
  "metacritic": 94,
  "screenshots": ["https://..."]
}
```

Si no hay match: `{ "imagen": null }`.

---

### Ofertas (ITAD proxy)

#### `GET /api/deals/top/ofertas` 🔓  
#### `GET /api/ofertas` 🔓 (alias)

```json
{
  "list": [ /* objetos ITAD */ ],
  "configured": true
}
```

Sin `ITAD_API_KEY`: `{ "list": [], "configured": false }`.

#### `GET /api/deals/:slug` 🔓

`:slug` = nombre URL-encoded del juego.

```json
{
  "found": true,
  "gameId": "abc",
  "configured": true,
  "deals": [
    {
      "tienda": "Steam",
      "precio": 29.99,
      "precioOriginal": 59.99,
      "descuento": 50,
      "url": "https://...",
      "enOferta": true
    }
  ],
  "precioHistoricoMinimo": 19.99,
  "moneda": "USD"
}
```

#### `GET /api/deals/history/:gameId` 🔓

`:gameId` = ID ITAD (no ID interno del catálogo).

```json
{
  "history": [
    { "timestamp": "2025-06-01T00:00:00.000Z", "price": 29.99 }
  ],
  "configured": true
}
```

---

### IA (SSE)

#### `POST /api/ai/stream` 🔓

**Body:**

```json
{
  "system": "Eres un experto en videojuegos...",
  "prompt": "Analiza Elden Ring en 3 párrafos."
}
```

**Response:** `text/event-stream`

```
data: {"content":"Fragmento "}

data: {"content":"de texto"}

data: {"done":true}
```

**Error en stream:** `data: {"error":"IA no disponible"}`

---

### Agente autónomo

#### `GET /api/agente/status` 🔓  
#### `GET /api/status` 🔓 (alias)

```json
{
  "activo": true,
  "ejecutandose": false,
  "ultimaEjecucion": "2026-05-20T06:00:00.000Z",
  "proximaEjecucion": "2026-05-21T06:00:00.000Z",
  "juegosHoy": 3,
  "totalJuegosAgregados": 45,
  "ultimasLineasLog": ["[timestamp] ..."],
  "stats7dias": [{ "fecha": "2026-05-14", "juegos": 2 }]
}
```

#### `GET /api/agente/juegos` 🔓  
#### `GET /api/juegos` 🔓 (alias)

```json
{
  "juegos": [ /* todos */ ],
  "juegosDe24h": [ /* últimas 24h */ ],
  "total": 45
}
```

#### `GET /api/agente/noticias` 🔓  
#### `GET /api/noticias` 🔓 (alias)

```json
{
  "noticias": [
    {
      "id": "...",
      "titulo": "...",
      "resumen": "...",
      "categoria": "Lanzamiento",
      "urgente": false,
      "fecha": "..."
    }
  ]
}
```

#### `POST /api/agente/run` 🔓

Ejecuta el agente manualmente (RAWG → Claude → JSON).

```json
{
  "success": true,
  "mensaje": "Agente completado. 3 juegos agregados, 3 noticias generadas.",
  "resultado": { "juegoAgregados": 3, "noticias": 3 }
}
```

---

## 6. Módulos del frontend

**Paquete:** `artifacts/gamereviews`  
**Entry:** `src/main.tsx` → `App.tsx`

### Sistema de rutas (Wouter)

| Ruta | Página | Protección | Función |
|------|--------|------------|---------|
| `/` | `home.tsx` | Pública | Hero, búsqueda, filtros, grid, ofertas, noticias agente |
| `/juego/:id` | `game-detail.tsx` | Pública | Detalle, trailer, IA, precios ITAD, reseñas API |
| `/ranking` | `ranking.tsx` | Pública | Tabs ranking + análisis IA |
| `/login` | `login.tsx` | Pública | Inicio de sesión |
| `/register` | `register.tsx` | Pública | Registro |
| `/mi-lista` | `my-list.tsx` | `ProtectedRoute` | Lista personal (localStorage) |
| `/perfil` | `profile.tsx` | `ProtectedRoute` | Perfil, reseñas propias API, exportar datos |
| `/suscripcion` | `subscription.tsx` | Pública | Planes Gratis / Pro / Elite |
| `/admin` | `admin.tsx` | Pública* | Panel agente IA (*sin guard admin en ruta) |
| `*` | `not-found.tsx` | — | 404 |

`ProtectedRoute` redirige a `/login?redirect={ruta}` si no hay sesión.

### Páginas — detalle

- **Home:** fusiona `games.json` + juegos del agente (24h), strip de ofertas ITAD, contador “online”, filtros animados (framer-motion).
- **Game detail:** reseñas vía `useGameReviews` (PostgreSQL), `DealsSection`, `AiAnalysis`, skins/packs del JSON.
- **Ranking:** agrega reseñas locales + API para métricas; streaming IA.
- **Mi lista:** estados `quiero_jugar | jugando | completado | abandonado`.
- **Perfil:** `useUserReviews` para CRUD de reseñas en BD; export JSON de localStorage.
- **Suscripción:** comparativa de features por plan (`use-plan`).
- **Admin:** monitorización y `POST /agente/run`.

### Componentes importantes

| Componente | Rol |
|------------|-----|
| `layout.tsx` | Navbar, footer, enlaces, estado auth |
| `game-card.tsx` | Tarjeta de catálogo con imagen y rating |
| `game-image.tsx` | Steam URL → fallback RAWG vía `/api/imagen` → gradiente |
| `ai-analysis.tsx` | UI streaming con `streamAi()` |
| `deals-section.tsx` | Precios por juego (ITAD) |
| `top-deals-strip.tsx` | Carrusel ofertas top |
| `review-replies.tsx` | Hilos de respuestas en reseñas |
| `stars.tsx` | Input/visualización de estrellas |
| `protected-route.tsx` | Guard de autenticación |
| `onboarding-modal.tsx` | Tutorial primera visita |
| `upgrade-modal.tsx` | Upsell a plan Pro/Elite |
| `price-alert-button.tsx` | CTA alertas de precio (UI) |
| `scroll-to-top.tsx` | Scroll al cambiar de ruta |

### Hooks principales

| Hook | Fuente de datos |
|------|-----------------|
| `use-auth.tsx` | API cookies — login/register/me/logout |
| `use-game-reviews.ts` | API `/resenas/*` |
| `use-user-reviews.ts` | API `/resenas/usuario/me` |
| `use-list.ts` | localStorage `gr_lista` |
| `use-user.ts` | localStorage `gr_usuario` (+ sync auth) |
| `use-reviews.ts` | localStorage legacy (home stats parciales) |
| `use-plan.ts` | localStorage `gr_plan` |
| `use-local-storage.ts` | Abstracción genérica |

### Librerías cliente

| Archivo | Función |
|---------|---------|
| `lib/api-base.ts` | `resolveApiUrl()` — origen API y prefijo `/api` |
| `lib/api-fetch.ts` | `apiFetch`, `apiJson` con credentials |
| `lib/ai.ts` | Cliente SSE para IA |
| `lib/deals.ts` | Cliente ofertas ITAD |

### Catálogo estático

`src/data/games.json` — ~40 entradas con: `id`, `nombre`, `slug`, `steamId`, géneros, plataformas, precios, imágenes Steam CDN, `video`, `skins`, `packs`, etc.

---

## 7. Sistema de autenticación

### Flujo completo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as API Express
    participant DB as PostgreSQL

    U->>F: Register/Login
    F->>A: POST /api/auth/register o /login
    A->>DB: INSERT/SELECT usuarios
    A->>A: bcrypt.compare / hash
    A->>A: jwt.sign(payload, JWT_SECRET)
    A->>F: Set-Cookie gr_token (httpOnly)
    F->>A: GET /api/auth/me (credentials)
    A->>A: jwt.verify(token)
    A->>F: { user }
```

### JWT

| Aspecto | Valor |
|---------|-------|
| Librería | `jsonwebtoken` |
| Cookie | `gr_token` (httpOnly) |
| Payload | `{ sub, nombre, email, rol }` |
| Expiración | 7 días (default) o 30 días si `rememberMe: true` |
| Secreto | `JWT_SECRET` (mín. 16 chars en producción) |
| Alternativa | Header `Authorization: Bearer {token}` |

### Cookies

Configuración en `authCookieOptions()`:

| Entorno | `secure` | `sameSite` | `httpOnly` |
|---------|----------|------------|------------|
| Desarrollo | `false` | `lax` | `true` |
| Producción | `true` | `none` | `true` |

`SameSite=None` + `Secure` permite cookies cross-site entre static site Render y API en otro subdominio.

### bcrypt

- **Rondas:** 12 (`BCRYPT_ROUNDS`)
- Registro: `bcrypt.hash(password, 12)` → `password_hash`
- Login: `bcrypt.compare(password, user.passwordHash)`
- **Por qué bcrypt:** resistencia a fuerza bruta, salt incorporado. **Alternativa:** Argon2 — más moderno pero bcrypt es estándar en Node y suficiente aquí.

### Registro (pasos)

1. Validar nombre (≥2), email, password (≥6).
2. Comprobar email único.
3. Generar `id`, hash password, color avatar aleatorio.
4. Insertar en `usuarios` con `rol: "user"`.
5. Firmar JWT y enviar cookie.
6. Frontend sincroniza `gr_usuario` en localStorage vía `setUserFromAuth`.

### Login (pasos)

1. Buscar usuario por email.
2. Comparar password con bcrypt.
3. JWT + cookie.
4. Actualizar cache React Query `["auth", "me"]`.

### Logout

`clearCookie(gr_token)` + invalidar estado en cliente.

### Autorización de reseñas

- Crear: requiere auth; `autor` = `req.auth.nombre`.
- Editar: solo si `existing.autor === req.auth.nombre`.
- Eliminar reseña: autor o `rol === "admin"`.
- Respuestas: mismo criterio por `autor`.

---

## 8. Variables de entorno

### Backend (`artifacts/api-server/.env`)

| Variable | Requerida | Descripción | Ejemplo |
|----------|-----------|-------------|---------|
| `PORT` | Sí | Puerto HTTP del servidor | `3001` |
| `NODE_ENV` | Sí (prod) | `development` / `production` | `production` |
| `DATABASE_URL` | Sí | Connection string PostgreSQL (SSL en Neon) | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Sí (prod) | Secreto HMAC JWT (≥16 caracteres) | `una-cadena-larga-aleatoria-segura` |
| `CORS_ORIGIN` | Recomendada | Orígenes permitidos separados por coma | `https://game-reviews-web.onrender.com` |
| `FRONTEND_URL` | Opcional | Alias adicional para CORS | Mismo que arriba |
| `RAWG_API_KEY` | Opcional | Mejora rate limits RAWG | `abc123...` |
| `ITAD_API_KEY` | Opcional | Precios y ofertas | `def456...` |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Opcional | API key Anthropic | `sk-ant-...` |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Opcional | Proxy/base URL custom | `https://...` |
| `LOG_LEVEL` | Opcional | Nivel Pino | `info` |

`src/env.ts` carga `artifacts/api-server/.env` con `dotenv` al iniciar.

### Frontend (build time)

| Variable | Cuándo | Descripción | Ejemplo |
|----------|--------|-------------|---------|
| `VITE_API_ORIGIN` | Build producción | URL absoluta del API (sin `/api`) | `https://game-reviews-hub-api.onrender.com` |
| `VITE_DEV_API_TARGET` | Dev opcional | Proxy Vite → API | `http://127.0.0.1:3001` |
| `PORT` | Dev | Puerto Vite | `5173` |
| `BASE_PATH` | Opcional | Subpath del SPA | `/` |
| `NODE_ENV` | Automático | Modo Vite | `development` |

> **Importante:** `VITE_*` se embebe en el bundle en **build time**. Tras cambiar `VITE_API_ORIGIN`, hay que **reconstruir** el static site.

### Render / sistema

| Variable | Descripción |
|----------|-------------|
| `RENDER=true` | Detectado por `scripts/ensure-pnpm.mjs` para permitir install en Render |

---

## 9. Cómo correr el proyecto localmente

### Requisitos previos

- **Node.js** 20+ (recomendado LTS)
- **pnpm** 11.1.1 (`corepack enable` o `npm i -g pnpm@11.1.1`)
- **PostgreSQL** local o cuenta **Neon** (gratuita)

### Configuración inicial (ambos SO)

```bash
# Clonar e instalar
cd Game-Reviews-Hub
pnpm install

# Configurar API
cp artifacts/api-server/.env.example artifacts/api-server/.env
# Editar .env: DATABASE_URL, JWT_SECRET, keys opcionales

# Crear tablas
pnpm run db:push
```

### Windows (PowerShell)

```powershell
# Terminal 1 — API (puerto 3001 por defecto en .env)
$env:PORT="3001"
pnpm --filter @workspace/api-server dev

# Terminal 2 — Frontend (puerto 5173)
pnpm --filter @workspace/gamereviews dev
```

Abrir: **http://localhost:5173**  
El proxy Vite redirige `/api/*` → `http://127.0.0.1:3001`.

**Alternativa un solo comando** (desde raíz):

```powershell
pnpm dev
```

### Linux / macOS

```bash
# Opción A: dos terminales (igual que Windows)
PORT=3001 pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/gamereviews dev

# Opción B: concurrently
pnpm dev
```

### Verificación

1. `curl http://127.0.0.1:3001/api/healthz` → `{"status":"ok"}`
2. Registrar usuario en `/register`
3. Publicar reseña en un juego (`/juego/1`)
4. (Opcional) Panel `/admin` si el agente tiene keys de IA/RAWG

### Problemas frecuentes

| Problema | Solución |
|----------|----------|
| CORS / cookies | Mismo origen vía proxy Vite; no hace falta `VITE_API_ORIGIN` en dev |
| `DATABASE_URL` | Verificar Postgres activo y `pnpm run db:push` |
| IA no responde | Configurar `AI_INTEGRATIONS_ANTHROPIC_API_KEY` |
| Ofertas vacías | Configurar `ITAD_API_KEY` en `.env` del API |

---

## 10. Cómo está deployado en producción

### Arquitectura Render

```mermaid
flowchart LR
    subgraph Render
        WEB[Static Site\ngame-reviews-web]
        API[Web Service\ngame-reviews-hub-api]
    end
    subgraph Neon
        PG[(PostgreSQL)]
    end
    USER[Usuario] --> WEB
    WEB -->|HTTPS + cookies| API
    API --> PG
    API --> RAWG
    API --> ITAD
    API --> Anthropic
```

**URLs de producción (configuradas en el repo):**

| Servicio | URL |
|----------|-----|
| Frontend | https://game-reviews-web.onrender.com |
| API | https://game-reviews-hub-api.onrender.com |

---

### Render — Web Service (API)

Configuración recomendada (`DEPLOYMENT.md` — raíz del repo):

| Campo | Valor |
|-------|-------|
| **Tipo** | Web Service |
| **Root Directory** | `.` (raíz del repositorio) |
| **Build Command** | `npm install -g pnpm@11.1.1 && pnpm install --ignore-scripts && pnpm --filter @workspace/api-server run build` |
| **Start Command** | `node --enable-source-maps artifacts/api-server/dist/index.mjs` |
| **Health Check Path** | `/api/healthz` |

**Variables de entorno en Render Dashboard:**

```
NODE_ENV=production
PORT=3001                    # Render puede inyectar PORT automáticamente
DATABASE_URL=postgresql://...@neon.tech/...?sslmode=require
JWT_SECRET=<cadena-aleatoria-larga>
CORS_ORIGIN=https://game-reviews-web.onrender.com
RAWG_API_KEY=<opcional>
ITAD_API_KEY=<opcional>
AI_INTEGRATIONS_ANTHROPIC_API_KEY=<opcional>
```

**Notas:**

- `preinstall` en raíz ejecuta `ensure-pnpm.mjs`; si `RENDER=true`, no bloquea npm.
- El `package.json` raíz no tiene dependencias — evita fallos del `npm install` automático de Render.
- Script alternativo: `render-backend-build.sh`.

**Archivo `render.yaml` (Blueprint):** define servicios con `rootDir: artifacts/api-server` — puede diferir del despliegue manual con raíz `.`. Priorizar la configuración activa en tu dashboard Render.

---

### Render — Static Site (Frontend)

| Campo | Valor |
|-------|-------|
| **Tipo** | Static Site |
| **Root Directory** | `.` |
| **Build Command** | `bash .render-build.sh` |
| **Publish Directory** | `artifacts/gamereviews/dist/public` |

El script `.render-build.sh`:

1. Instala pnpm 11.1.1
2. `pnpm install` en `artifacts/gamereviews`
3. Exporta `VITE_API_ORIGIN=https://game-reviews-hub-api.onrender.com`
4. Ejecuta `pnpm run build`

**Salida Vite:** `artifacts/gamereviews/dist/public/index.html` (+ assets).

**Rewrite SPA:** todas las rutas → `index.html` (configurar en Render o `render.yaml`).

---

### Neon PostgreSQL

| Paso | Acción |
|------|--------|
| 1 | Crear proyecto en [neon.tech](https://neon.tech) |
| 2 | Copiar connection string con `?sslmode=require` |
| 3 | Pegar en `DATABASE_URL` del Web Service Render |
| 4 | Desde máquina local con esa URL: `pnpm run db:push` |
| 5 | Verificar tablas: `usuarios`, `resenas`, `votos_utilidad`, `respuestas` |

**Por qué Neon:** escalado serverless, ramas de BD para dev/staging, latencia baja con Render (misma región si se configura `us-east` / `eu-central`).

**Alternativa en Render:** Postgres gestionado por Render — también válido; cambiar solo `DATABASE_URL`.

---

### Checklist post-deploy

1. Health check API OK.
2. `JWT_SECRET` y `CORS_ORIGIN` correctos.
3. Frontend rebuildeadO tras cambiar `VITE_API_ORIGIN`.
4. Registro + login + cookie en producción (DevTools → Application → Cookies).
5. Crear reseña de prueba.
6. (Opcional) Ejecutar agente desde `/admin`.

---

## 11. Estructura de carpetas

```
Game-Reviews-Hub/
├── DOCUMENTACION.md          # Este archivo
├── DEPLOYMENT.md             # Guía deploy Render (inglés)
├── package.json                # Scripts raíz: dev, db:push, build
├── pnpm-workspace.yaml         # Workspaces + catalog de versiones
├── render.yaml                 # Blueprint Render (opcional)
├── .render-build.sh            # Build frontend en Render
├── render-backend-build.sh     # Build API alternativo
│
├── artifacts/
│   ├── api-server/             # Backend Express
│   │   ├── src/
│   │   │   ├── index.ts        # Entry: listen + cron agente
│   │   │   ├── app.ts          # Express app, CORS, /api router
│   │   │   ├── env.ts          # dotenv
│   │   │   ├── routes/         # auth, reviews, deals, ai, agente...
│   │   │   ├── middleware/     # requireAuth, optionalAuth
│   │   │   ├── lib/            # auth JWT, cookies, logger, errors
│   │   │   └── agent/          # agente.ts, agenteCron.ts
│   │   ├── data/               # juegos-agente.json, noticias.json
│   │   ├── logs/               # agente.log
│   │   ├── dist/               # Build esbuild (generado)
│   │   └── .env.example
│   │
│   ├── gamereviews/            # Frontend React (app principal)
│   │   ├── src/
│   │   │   ├── pages/          # home, game-detail, ranking, etc.
│   │   │   ├── components/     # UI + game-card, ai-analysis...
│   │   │   ├── hooks/          # auth, reviews, list, user
│   │   │   ├── lib/            # api-fetch, ai, deals
│   │   │   └── data/games.json # Catálogo estático
│   │   └── dist/public/        # Build producción Vite
│   │
│   └── mockup-sandbox/         # Sandbox UI (no producción)
│
├── lib/
│   ├── db/                     # Drizzle schema + pool Postgres
│   ├── api-spec/               # OpenAPI (health)
│   ├── api-zod/                # Tipos Zod generados
│   ├── api-client-react/       # Cliente React generado (Orval)
│   └── integrations-anthropic-ai/  # Cliente Anthropic compartido
│
├── scripts/
│   ├── ensure-pnpm.mjs         # Guard preinstall / Render
│   └── post-merge.sh
│
└── attached_assets/            # Prompts y assets de diseño (referencia)
```

### Paquetes workspace clave

| Paquete | Ruta | Rol |
|---------|------|-----|
| `@workspace/api-server` | `artifacts/api-server` | API REST |
| `@workspace/gamereviews` | `artifacts/gamereviews` | SPA React |
| `@workspace/db` | `lib/db` | Schema Drizzle + `push` |
| `@workspace/integrations-anthropic-ai` | `lib/integrations-anthropic-ai` | SDK Claude |
| `@workspace/api-zod` | `lib/api-zod` | Validación tipada |
| `@workspace/api-client-react` | `lib/api-client-react` | Hooks generados (uso limitado) |

---

## Referencias rápidas

| Recurso | Enlace / comando |
|---------|------------------|
| Health producción | `GET https://game-reviews-hub-api.onrender.com/api/healthz` |
| Push schema BD | `pnpm run db:push` |
| Dev local | `pnpm dev` |
| ITAD API docs | https://isthereanydeal.com/api/ |
| RAWG API docs | https://rawg.io/apidocs |
| Anthropic docs | https://docs.anthropic.com |

---

*Documentación generada a partir del código fuente del repositorio Game Reviews Hub. Última revisión alineada con el monorepo pnpm y despliegue Render + Neon.*
