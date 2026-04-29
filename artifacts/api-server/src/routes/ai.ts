import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

interface AiRequestBody {
  system?: string;
  prompt?: string;
}

router.post("/ai/stream", async (req, res) => {
  const body = req.body as AiRequestBody;
  const system = typeof body.system === "string" ? body.system : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : "";

  if (!prompt.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: system || undefined,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(
          `data: ${JSON.stringify({ content: event.delta.text })}\n\n`,
        );
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI stream error");
    res.write(
      `data: ${JSON.stringify({
        error: "Error generando respuesta de IA",
      })}\n\n`,
    );
    res.end();
  }
});

export default router;
