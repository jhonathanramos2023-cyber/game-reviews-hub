const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

export interface Deal {
  tienda: string;
  precio: number;
  precioOriginal: number;
  descuento: number;
  url: string;
  enOferta: boolean;
}

export interface DealsResponse {
  found: boolean;
  configured: boolean;
  deals: Deal[];
  precioHistoricoMinimo?: number | null;
  moneda?: string;
  gameId?: string;
}

export interface TopDealsResponse {
  list: Array<{
    id?: string;
    title?: string;
    deal?: {
      shop?: { name?: string };
      price?: { amount?: number };
      regular?: { amount?: number };
      cut?: number;
      url?: string;
    };
    assets?: { boxart?: string; banner145?: string; banner300?: string; banner400?: string; banner600?: string };
  }>;
  configured: boolean;
}

export interface PriceHistoryResponse {
  history: Array<{ timestamp: string; price: number | null }>;
  configured: boolean;
}

export async function fetchDealsForGame(
  nombre: string,
): Promise<DealsResponse> {
  try {
    const res = await fetch(`${apiBase}/deals/${encodeURIComponent(nombre)}`);
    if (!res.ok) {
      return { found: false, configured: false, deals: [] };
    }
    return (await res.json()) as DealsResponse;
  } catch {
    return { found: false, configured: false, deals: [] };
  }
}

export async function fetchTopDeals(): Promise<TopDealsResponse> {
  try {
    const res = await fetch(`${apiBase}/deals/top/ofertas`);
    if (!res.ok) return { list: [], configured: false };
    return (await res.json()) as TopDealsResponse;
  } catch {
    return { list: [], configured: false };
  }
}

export async function fetchPriceHistory(
  gameId: string,
): Promise<PriceHistoryResponse> {
  try {
    const res = await fetch(`${apiBase}/deals/history/${gameId}`);
    if (!res.ok) return { history: [], configured: false };
    return (await res.json()) as PriceHistoryResponse;
  } catch {
    return { history: [], configured: false };
  }
}
