import { resolveApiUrl } from "@/lib/api-base";

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(resolveApiUrl(path), {
    ...init,
    credentials: "include",
    cache: init?.cache ?? "no-store",
    headers: {
      ...(init?.body != null ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

export async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Respuesta inválida del servidor");
  }
}
