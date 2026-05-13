export type AiStreamHandlers = {
  onChunk: (text: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

import { resolveApiUrl } from "@/lib/api-base";

export async function streamAi(
  system: string,
  prompt: string,
  handlers: AiStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const response = await fetch(resolveApiUrl("/ai/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, prompt }),
      signal,
    });

    if (!response.ok || !response.body) {
      handlers.onError?.("No se pudo conectar con la IA.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          const data = JSON.parse(payload) as {
            content?: string;
            done?: boolean;
            error?: string;
          };
          if (data.error) {
            handlers.onError?.(data.error);
            return;
          }
          if (data.content) {
            handlers.onChunk(data.content);
          }
          if (data.done) {
            handlers.onDone?.();
            return;
          }
        } catch {
          // ignore malformed event
        }
      }
    }

    handlers.onDone?.();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError?.("Error inesperado al llamar a la IA.");
  }
}
