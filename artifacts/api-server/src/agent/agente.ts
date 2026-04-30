import path from "node:path";
import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { logger } from "../lib/logger";

const DATA_DIR = path.join(__dirname, "..", "data");
const LOGS_DIR = path.join(__dirname, "..", "logs");
const JUEGOS_FILE = path.join(DATA_DIR, "juegos-agente.json");
const NOTICIAS_FILE = path.join(DATA_DIR, "noticias.json");
const LOG_FILE = path.join(LOGS_DIR, "agente.log");

function ensureDirs() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });
}

function appendLog(msg: string) {
  try {
    appendFileSync(LOG_FILE, msg + "\n", "utf-8");
  } catch {
    logger.error("Failed to write agent log");
  }
}

function readJSON<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

interface RawgGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  released: string | null;
  genres: Array<{ name: string }> | null;
  platforms: Array<{ platform: { name: string } }> | null;
  tags: Array<{ name: string }> | null;
  short_screenshots?: Array<{ image: string }>;
}

interface AgenteJuego {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  descripcionCorta: string;
  generos: string[];
  plataformas: string[];
  etiquetas: string[];
  porQueDestaca: string;
  imagen: string;
  imagenBanner: string;
  rawgId: number | null;
  metacritic: number | null;
  fechaLanzamiento: string;
  rating: number;
  precio: number;
  desarrollador: string;
  agregadoPorAgente: boolean;
  fechaAgregado: string;
}

export interface Noticia {
  id: string;
  titulo: string;
  resumen: string;
  categoria: "Lanzamiento" | "Actualización" | "Oferta" | "Comunidad";
  urgente: boolean;
  fecha: string;
}

export type { AgenteJuego };

async function fetchTrendingGames(): Promise<RawgGame[]> {
  const key = process.env.RAWG_API_KEY ?? "";
  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;

  const params = new URLSearchParams({
    ordering: "-added",
    dates: `${yesterday},${today}`,
    page_size: "20",
  });
  if (key) params.set("key", key);

  const url = `https://api.rawg.io/api/games?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG trending fetch failed: ${res.status}`);
  const data = (await res.json()) as { results?: RawgGame[] };
  return data.results ?? [];
}

async function callClaude(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJSON<T>(text: string, fallback: T): T {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

export async function runAgente(): Promise<{
  juegoAgregados: number;
  noticias: number;
  error?: string;
}> {
  ensureDirs();
  const startTs = new Date().toISOString();
  appendLog(`[${startTs}] Agente iniciando...`);
  logger.info("Agente IA iniciando ciclo");

  try {
    const trending = await fetchTrendingGames();
    appendLog(`[${startTs}] RAWG: ${trending.length} juegos trending obtenidos`);

    if (trending.length === 0) {
      appendLog(`[${startTs}] Sin juegos trending. Ciclo terminado.`);
      return { juegoAgregados: 0, noticias: 0 };
    }

    const simplificados = trending.slice(0, 20).map((g) => ({
      id: g.id,
      nombre: g.name,
      slug: g.slug,
      imagen: g.background_image,
      rating: g.rating,
      metacritic: g.metacritic,
      fechaLanzamiento: g.released,
      generos: (g.genres ?? []).map((x) => x.name),
      plataformas: (g.platforms ?? []).map((x) => x.platform.name).slice(0, 5),
      etiquetas: (g.tags ?? []).map((x) => x.name).slice(0, 8),
    }));

    const juegoPrompt = `Eres el editor de GameReviews, una plataforma de reseñas de videojuegos en español para jugadores latinoamericanos.

Aquí hay ${simplificados.length} juegos nuevos/trending de hoy desde la API de RAWG:
${JSON.stringify(simplificados, null, 2)}

Tu tarea:
1. Selecciona EXACTAMENTE 3 juegos que valgan la pena agregar (los más relevantes, interesantes o populares)
2. Para cada uno genera en ESPAÑOL:
   - descripcion: 2 oraciones atractivas que enganchen al lector
   - descripcionCorta: 1 frase de máximo 10 palabras, muy directa
   - generos: array de géneros traducidos al español (ej: "Acción", "RPG", "Estrategia")
   - plataformas: array de plataformas donde está disponible
   - etiquetas: array de 5 tags relevantes en español
   - porQueDestaca: 1 oración impactante de por qué este juego es notable HOY
   - desarrollador: nombre del estudio (si no sabes, pon "Estudio Independiente")
   - precio: precio estimado en USD (número, por ejemplo 29.99)

Devuelve SOLO un JSON array sin texto adicional, sin markdown, sin explicaciones:
[
  {
    "rawgId": 123,
    "nombre": "Nombre del Juego",
    "slug": "slug-del-juego",
    "descripcion": "...",
    "descripcionCorta": "...",
    "generos": ["Acción", "RPG"],
    "plataformas": ["PC", "PlayStation 5"],
    "etiquetas": ["multijugador", "mundo abierto", "historia épica", "gráficos impresionantes", "cooperativo"],
    "porQueDestaca": "...",
    "imagen": "url de imagen de rawg o null",
    "imagenBanner": "url de imagen de rawg o null",
    "metacritic": 85,
    "fechaLanzamiento": "2025-01-01",
    "desarrollador": "Nombre del estudio",
    "precio": 59.99
  }
]`;

    const juegoRespuesta = await callClaude(juegoPrompt);

    interface ClaudeJuego {
      rawgId?: number | null;
      nombre?: string;
      slug?: string;
      descripcion?: string;
      descripcionCorta?: string;
      generos?: string[];
      plataformas?: string[];
      etiquetas?: string[];
      porQueDestaca?: string;
      imagen?: string | null;
      imagenBanner?: string | null;
      metacritic?: number | null;
      fechaLanzamiento?: string;
      desarrollador?: string;
      precio?: number;
    }

    const juegosGenerados = parseJSON<ClaudeJuego[]>(juegoRespuesta, []);

    const juegoActuales = readJSON<AgenteJuego[]>(JUEGOS_FILE, []);
    const existingRawgIds = new Set(
      juegoActuales.map((j) => j.rawgId).filter(Boolean),
    );

    const nuevos: AgenteJuego[] = juegosGenerados
      .filter((j) => j.rawgId && !existingRawgIds.has(j.rawgId))
      .map((j, i) => ({
        id: Date.now() + i,
        nombre: j.nombre ?? "Juego Desconocido",
        slug: j.slug ?? `juego-${Date.now() + i}`,
        descripcion: j.descripcion ?? "",
        descripcionCorta: j.descripcionCorta ?? "",
        generos: j.generos ?? [],
        plataformas: j.plataformas ?? [],
        etiquetas: j.etiquetas ?? [],
        porQueDestaca: j.porQueDestaca ?? "",
        imagen:
          j.imagen ??
          "https://media.rawg.io/media/games/default.jpg",
        imagenBanner:
          j.imagenBanner ??
          j.imagen ??
          "https://media.rawg.io/media/games/default.jpg",
        rawgId: j.rawgId ?? null,
        metacritic: j.metacritic ?? null,
        fechaLanzamiento: j.fechaLanzamiento ?? new Date().toISOString().split("T")[0]!,
        rating: 0,
        precio: j.precio ?? 29.99,
        desarrollador: j.desarrollador ?? "Estudio Independiente",
        agregadoPorAgente: true,
        fechaAgregado: new Date().toISOString(),
      }));

    const juegoActualizados = [...juegoActuales, ...nuevos];
    writeJSON(JUEGOS_FILE, juegoActualizados);
    appendLog(
      `[${startTs}] Juegos: ${nuevos.length} nuevos agregados (total: ${juegoActualizados.length})`,
    );

    const noticiasPrompt = `Eres el periodista de GameReviews, una plataforma de gaming en español.

Basándote en estos juegos trending de hoy:
${JSON.stringify(simplificados.slice(0, 5), null, 2)}

Genera EXACTAMENTE 3 noticias cortas para mostrar en la sección de novedades del sitio.
Cada noticia debe ser relevante, atractiva, informativa y escrita en español latino.

Devuelve SOLO un JSON array sin texto adicional, sin markdown:
[
  {
    "titulo": "Título impactante de máximo 10 palabras",
    "resumen": "Máximo 2 oraciones que expliquen la noticia de forma atractiva.",
    "categoria": "Lanzamiento",
    "urgente": false
  }
]

Las categorías permitidas son: "Lanzamiento", "Actualización", "Oferta", "Comunidad"`;

    const noticiasRespuesta = await callClaude(noticiasPrompt);

    interface ClaudeNoticia {
      titulo?: string;
      resumen?: string;
      categoria?: "Lanzamiento" | "Actualización" | "Oferta" | "Comunidad";
      urgente?: boolean;
    }

    const noticiasGeneradas = parseJSON<ClaudeNoticia[]>(noticiasRespuesta, []);
    const nuevasNoticias: Noticia[] = noticiasGeneradas.slice(0, 3).map(
      (n, i) => ({
        id: `${Date.now()}-${i}`,
        titulo: n.titulo ?? "Novedad del día",
        resumen: n.resumen ?? "",
        categoria:
          n.categoria && ["Lanzamiento", "Actualización", "Oferta", "Comunidad"].includes(n.categoria)
            ? n.categoria
            : "Lanzamiento",
        urgente: n.urgente ?? false,
        fecha: new Date().toISOString(),
      }),
    );

    writeJSON(NOTICIAS_FILE, nuevasNoticias);
    appendLog(
      `[${startTs}] Noticias: ${nuevasNoticias.length} generadas`,
    );

    const endTs = new Date().toISOString();
    appendLog(
      `[${endTs}] ✅ Agente completado. ${nuevos.length} juegos agregados, ${nuevasNoticias.length} noticias generadas.`,
    );
    logger.info(
      { juegoAgregados: nuevos.length, noticias: nuevasNoticias.length },
      "Agente IA ciclo completado",
    );

    return { juegoAgregados: nuevos.length, noticias: nuevasNoticias.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    appendLog(`[${startTs}] ❌ ERROR: ${msg}`);
    logger.error({ err }, "Agente IA error");
    return { juegoAgregados: 0, noticias: 0, error: msg };
  }
}
