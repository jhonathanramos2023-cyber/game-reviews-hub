import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ITAD_BASE = "https://api.isthereanydeal.com";

function getApiKey(): string | null {
  return process.env.ITAD_API_KEY ?? null;
}

interface ItadSearchEntry {
  id: string;
  title: string;
}

interface ItadShop {
  name: string;
}

interface ItadPriceAmount {
  amount: number;
  currency?: string;
}

interface ItadDeal {
  shop: ItadShop;
  price: ItadPriceAmount;
  regular: ItadPriceAmount;
  cut?: number;
  url: string;
}

interface ItadPricesEntry {
  id: string;
  deals: ItadDeal[];
}

interface ItadHistoryLowEntry {
  id: string;
  low?: { amount: number; shop?: ItadShop; timestamp?: string };
}

router.get("/deals/top/ofertas", async (_req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.json({ list: [], configured: false });
    return;
  }
  try {
    const response = await fetch(
      `${ITAD_BASE}/deals/v2?key=${apiKey}&limit=12&sort=-cut&country=US`,
    );
    if (!response.ok) {
      res.json({ list: [], configured: true, error: "ITAD request failed" });
      return;
    }
    const data = (await response.json()) as { list?: unknown[] };
    res.json({ list: data.list ?? [], configured: true });
  } catch (err) {
    res.json({ list: [], configured: true, error: (err as Error).message });
  }
});

router.get("/deals/history/:gameId", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.json({ history: [], configured: false });
    return;
  }
  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const response = await fetch(
      `${ITAD_BASE}/games/history/v2?key=${apiKey}&since=${since.toISOString()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([req.params.gameId]),
      },
    );
    if (!response.ok) {
      res.json({ history: [], configured: true });
      return;
    }
    const data = (await response.json()) as Array<{
      id: string;
      history?: Array<{ timestamp: string; deal?: { price: ItadPriceAmount } }>;
    }>;
    const first = data?.[0];
    const history = (first?.history ?? []).map((h) => ({
      timestamp: h.timestamp,
      price: h.deal?.price?.amount ?? null,
    }));
    res.json({ history, configured: true });
  } catch (err) {
    res.json({ history: [], configured: true, error: (err as Error).message });
  }
});

router.get("/deals/:slug", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.json({ found: false, deals: [], configured: false });
    return;
  }
  try {
    const title = decodeURIComponent(req.params.slug);

    const searchResp = await fetch(
      `${ITAD_BASE}/games/search/v1?key=${apiKey}&title=${encodeURIComponent(title)}&results=1`,
    );
    if (!searchResp.ok) {
      res.json({ found: false, deals: [], configured: true });
      return;
    }
    const searchData = (await searchResp.json()) as ItadSearchEntry[];
    if (!searchData.length) {
      res.json({ found: false, deals: [], configured: true });
      return;
    }
    const gameId = searchData[0].id;

    const [pricesResp, histResp] = await Promise.all([
      fetch(
        `${ITAD_BASE}/games/prices/v2?key=${apiKey}&country=US&nondeals=true&vouchers=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([gameId]),
        },
      ),
      fetch(`${ITAD_BASE}/games/historylow/v1?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([gameId]),
      }),
    ]);

    const pricesData = pricesResp.ok
      ? ((await pricesResp.json()) as ItadPricesEntry[])
      : [];
    const histData = histResp.ok
      ? ((await histResp.json()) as ItadHistoryLowEntry[])
      : [];

    const prices = pricesData?.[0]?.deals ?? [];
    const historicalLow = histData?.[0]?.low ?? null;

    res.json({
      found: true,
      gameId,
      configured: true,
      deals: prices.map((d) => {
        const original = d.regular.amount || d.price.amount;
        const discount =
          original > 0
            ? Math.round(((original - d.price.amount) / original) * 100)
            : 0;
        return {
          tienda: d.shop.name,
          precio: d.price.amount,
          precioOriginal: original,
          descuento: discount,
          url: d.url,
          enOferta: d.price.amount < original,
        };
      }),
      precioHistoricoMinimo: historicalLow?.amount ?? null,
      moneda: "USD",
    });
  } catch (err) {
    req.log.error({ err }, "deals fetch error");
    res.json({
      found: false,
      deals: [],
      configured: true,
      error: (err as Error).message,
    });
  }
});

export default router;
