import { Router, type IRouter } from "express";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { runAgente, type AgenteJuego, type Noticia } from "../agent/agente";

const router: IRouter = Router();

const DATA_DIR = path.join(__dirname, "..", "data");
const LOGS_DIR = path.join(__dirname, "..", "logs");
const JUEGOS_FILE = path.join(DATA_DIR, "juegos-agente.json");
const NOTICIAS_FILE = path.join(DATA_DIR, "noticias.json");
const LOG_FILE = path.join(LOGS_DIR, "agente.log");

let ultimaEjecucion: string | null = null;
let ejecutandose = false;

function readJSON<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function getLastRunFromLog(): string | null {
  try {
    if (!existsSync(LOG_FILE)) return null;
    const lines = readFileSync(LOG_FILE, "utf-8").trim().split("\n");
    const completedLine = [...lines]
      .reverse()
      .find((l) => l.includes("Agente completado") || l.includes("ERROR"));
    if (!completedLine) return null;
    const match = completedLine.match(/\[(.+?)\]/);
    return match ? match[1]! : null;
  } catch {
    return null;
  }
}

function getRecentLogLines(): string[] {
  try {
    if (!existsSync(LOG_FILE)) return [];
    const lines = readFileSync(LOG_FILE, "utf-8").trim().split("\n");
    return lines.slice(-50).filter(Boolean);
  } catch {
    return [];
  }
}

function getLast7DaysStats(): Array<{ fecha: string; juegos: number }> {
  const juegos = readJSON<AgenteJuego[]>(JUEGOS_FILE, []);
  const stats: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0]!;
    stats[key] = 0;
  }

  for (const j of juegos) {
    const day = j.fechaAgregado?.split("T")[0];
    if (day && day in stats) {
      stats[day] = (stats[day] ?? 0) + 1;
    }
  }

  return Object.entries(stats).map(([fecha, juegoCount]) => ({
    fecha,
    juegos: juegoCount,
  }));
}

router.get("/agente/status", (req, res) => {
  const lastRun = ultimaEjecucion ?? getLastRunFromLog();
  const juegos = readJSON<AgenteJuego[]>(JUEGOS_FILE, []);
  const hoy = new Date().toISOString().split("T")[0]!;
  const juegosHoy = juegos.filter(
    (j) => j.fechaAgregado?.startsWith(hoy),
  ).length;

  const nextRun = new Date();
  nextRun.setUTCHours(6, 0, 0, 0);
  if (nextRun <= new Date()) nextRun.setUTCDate(nextRun.getUTCDate() + 1);

  res.json({
    activo: true,
    ejecutandose,
    ultimaEjecucion: lastRun,
    proximaEjecucion: nextRun.toISOString(),
    juegosHoy,
    totalJuegosAgregados: juegos.length,
    ultimasLineasLog: getRecentLogLines(),
    stats7dias: getLast7DaysStats(),
  });
});

router.post("/agente/run", async (req, res) => {
  if (ejecutandose) {
    res.json({ success: false, mensaje: "El agente ya está en ejecución" });
    return;
  }

  ejecutandose = true;
  req.log.info("Agente IA: ejecución manual iniciada");

  try {
    const resultado = await runAgente();
    ultimaEjecucion = new Date().toISOString();
    req.log.info(resultado, "Agente IA: ejecución manual completada");
    res.json({
      success: true,
      mensaje: `Agente completado. ${resultado.juegoAgregados} juegos agregados, ${resultado.noticias} noticias generadas.`,
      resultado,
    });
  } catch (err) {
    req.log.error({ err }, "Agente IA: error en ejecución manual");
    res.status(500).json({ success: false, mensaje: "Error ejecutando agente", error: String(err) });
  } finally {
    ejecutandose = false;
  }
});

router.get("/agente/juegos", (_req, res) => {
  const juegos = readJSON<AgenteJuego[]>(JUEGOS_FILE, []);
  const hoy = new Date().toISOString().split("T")[0]!;
  const juegosDe24h = juegos.filter((j) => {
    if (!j.fechaAgregado) return false;
    const diff = Date.now() - new Date(j.fechaAgregado).getTime();
    return diff < 24 * 60 * 60 * 1000;
  });
  res.json({ juegos, juegosDe24h, total: juegos.length });
});

router.get("/agente/noticias", (_req, res) => {
  const noticias = readJSON<Noticia[]>(NOTICIAS_FILE, []);
  res.json({ noticias });
});

export default router;
