import { resolveApiUrl } from "@/lib/api-base";

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(resolveApiUrl(path), {
      ...init,
      credentials: "include",
      cache: init?.cache ?? "no-store",
      headers: {
        ...(init?.body != null ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    const origin = import.meta.env.VITE_API_ORIGIN as string | undefined;
    if (origin?.trim()) {
      throw new Error(
        `No se pudo conectar con la API (${origin}). Comprueba que el servidor esté activo y CORS_ORIGIN en el backend.`,
      );
    }
    throw new Error(
      "No se pudo conectar con la API. En desarrollo, arranca el api-server (puerto 3001) o define VITE_API_ORIGIN.",
    );
  }
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

type ApiErrorBody = { error?: string; message?: string };

export function getApiErrorMessage(data: ApiErrorBody, fallback: string): string {
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

/** POST/GET JSON API with credentials; throws Error with server message when possible. */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  const data = await parseApiJson<T & ApiErrorBody>(res);
  if (!res.ok) {
    throw new Error(getApiErrorMessage(data, `Error del servidor (${res.status})`));
  }
  return data;
}
