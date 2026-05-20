import { Router, type IRouter } from "express";
import { json200 } from "../lib/http-json";
import { routeParam } from "../lib/params";

const router: IRouter = Router();

const RAWG_BASE = "https://api.rawg.io/api";

interface RawgGame {
  id?: number;
  name?: string;
  slug?: string;
  background_image?: string | null;
  background_image_additional?: string | null;
  rating?: number;
  metacritic?: number | null;
  short_screenshots?: Array<{ image: string }>;
}

function buildUrl(search: string): string {
  const key = process.env.RAWG_API_KEY ?? "";
  const params = new URLSearchParams({
    search,
    page_size: "8",
  });
  if (key) params.set("key", key);
  return `${RAWG_BASE}/games?${params.toString()}`;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreMatch(query: string, game: RawgGame): number {
  const q = normalize(query);
  const name = normalize(game.name ?? "");
  const slug = normalize((game.slug ?? "").replace(/-/g, " "));
  if (!q) return 0;
  if (name === q || slug === q) return 100;
  if (name.includes(q) || q.includes(name)) return 80;
  if (slug.includes(q.replace(/ /g, "")) || q.includes(slug)) return 70;
  const qWords = q.split(/\s+/).filter(Boolean);
  const matched = qWords.filter((w) => name.includes(w) || slug.includes(w)).length;
  return (matched / qWords.length) * 60;
}

function pickImage(juego: RawgGame): string | null {
  return (
    juego.background_image ??
    juego.short_screenshots?.[0]?.image ??
    juego.background_image_additional ??
    null
  );
}

async function searchBestImage(queries: string[]): Promise<{
  imagen: string | null;
  imagenAdicional: string | null;
  rating: number | null;
  metacritic: number | null;
  screenshots: string[];
} | null> {
  const seen = new Set<string>();
  let best: { game: RawgGame; score: number } | null = null;

  for (const query of queries) {
    const q = query.trim();
    if (!q || seen.has(q.toLowerCase())) continue;
    seen.add(q.toLowerCase());

    const response = await fetch(buildUrl(q));
    if (!response.ok) continue;

    const data = (await response.json()) as { results?: RawgGame[] };
    for (const game of data.results ?? []) {
      const score = scoreMatch(q, game);
      if (!best || score > best.score) {
        best = { game, score };
      }
    }
  }

  if (!best || best.score < 30) return null;

  const juego = best.game;
  return {
    imagen: pickImage(juego),
    imagenAdicional: juego.background_image_additional ?? null,
    rating: juego.rating ?? null,
    metacritic: juego.metacritic ?? null,
    screenshots: juego.short_screenshots?.map((s) => s.image) ?? [],
  };
}

router.get("/imagen/:nombre", async (req, res) => {
  try {
    const name = decodeURIComponent(routeParam(req.params.nombre));
    const slug =
      typeof req.query.slug === "string" ? decodeURIComponent(req.query.slug) : "";

    const slugAsTitle = slug.replace(/-/g, " ").trim();
    const queries = [name, slugAsTitle, slug].filter(Boolean);

    const result = await searchBestImage(queries);
    if (!result) {
      json200(res, { imagen: null });
      return;
    }

    json200(res, result);
  } catch (err) {
    req.log.error({ err }, "RAWG image lookup failed");
    json200(res, { imagen: null });
  }
});

export default router;
