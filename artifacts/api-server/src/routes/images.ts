import { Router, type IRouter } from "express";

const router: IRouter = Router();

const RAWG_BASE = "https://api.rawg.io/api";

interface RawgGame {
  id?: number;
  background_image?: string | null;
  background_image_additional?: string | null;
  rating?: number;
  metacritic?: number | null;
  short_screenshots?: Array<{ image: string }>;
}

function buildUrl(name: string): string {
  const key = process.env.RAWG_API_KEY ?? "";
  const params = new URLSearchParams({
    search: name,
    page_size: "1",
  });
  if (key) params.set("key", key);
  return `${RAWG_BASE}/games?${params.toString()}`;
}

router.get("/imagen/:nombre", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.nombre);
    const response = await fetch(buildUrl(name));
    if (!response.ok) {
      res.json({ imagen: null });
      return;
    }
    const data = (await response.json()) as { results?: RawgGame[] };
    const juego = data.results?.[0];
    if (!juego) {
      res.json({ imagen: null });
      return;
    }
    res.json({
      imagen: juego.background_image ?? null,
      imagenAdicional: juego.background_image_additional ?? null,
      rating: juego.rating ?? null,
      metacritic: juego.metacritic ?? null,
      screenshots: juego.short_screenshots?.map((s) => s.image) ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "RAWG image lookup failed");
    res.json({ imagen: null });
  }
});

export default router;
