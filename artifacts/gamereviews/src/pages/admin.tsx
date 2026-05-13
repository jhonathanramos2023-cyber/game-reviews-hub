import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Bot, Play, RefreshCw, Zap, Clock, GamepadIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveApiUrl } from "@/lib/api-base";

interface AgenteStatus {
  activo: boolean;
  ejecutandose: boolean;
  ultimaEjecucion: string | null;
  proximaEjecucion: string | null;
  juegosHoy: number;
  totalJuegosAgregados: number;
  ultimasLineasLog: string[];
  stats7dias: Array<{ fecha: string; juegos: number }>;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 23) return `Hace ${Math.floor(h / 24)} día(s)`;
  if (h > 0) return `Hace ${h}h ${m}m`;
  if (m > 0) return `Hace ${m} minuto(s)`;
  return "Hace menos de 1 minuto";
}

function timeUntil(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Ahora";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `En ${h}h ${m}m`;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("es", { weekday: "short", day: "numeric" });
}

export default function Admin() {
  const [status, setStatus] = useState<AgenteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tick, setTick] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const r = await fetch(resolveApiUrl("/agente/status"));
      const d = (await r.json()) as AgenteStatus;
      setStatus(d);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
      setTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [status?.ultimasLineasLog]);

  const handleRun = async () => {
    setRunning(true);
    setRunMsg(null);
    try {
      const r = await fetch(resolveApiUrl("/agente/run"), { method: "POST" });
      const d = (await r.json()) as { success: boolean; mensaje: string };
      setRunMsg({ ok: d.success, text: d.mensaje });
      await fetchStatus();
    } catch {
      setRunMsg({ ok: false, text: "Error de conexión con el servidor" });
    } finally {
      setRunning(false);
    }
  };

  const isActive = status?.activo ?? false;
  const isExecuting = running || (status?.ejecutandose ?? false);

  return (
    <div
      className="min-h-screen bg-black text-green-400 font-mono p-4 md:p-8"
      style={{ fontFamily: "'Courier New', 'Lucida Console', monospace" }}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-green-700 rounded-lg p-6 bg-black/80"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bot className="w-10 h-10 text-green-400" />
                {isExecuting && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-green-300 tracking-widest uppercase">
                  Centro de Control — Agente IA
                </h1>
                <p className="text-green-600 text-sm">
                  GameReviews Autonomous Update System v1.0
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isActive ? (
                <span className="flex items-center gap-2 bg-green-900/40 border border-green-600 text-green-300 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  ACTIVO
                </span>
              ) : (
                <span className="flex items-center gap-2 bg-red-900/40 border border-red-600 text-red-400 px-4 py-2 rounded text-sm font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  INACTIVO
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 text-green-700 text-xs">
            {`> `}Sistema de actualización autónoma activo — actualiza el catálogo cada 24h sin intervención manual
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: Clock,
              label: "Última Ejecución",
              value: timeAgo(status?.ultimaEjecucion ?? null),
            },
            {
              icon: Zap,
              label: "Próxima Ejecución",
              value: timeUntil(status?.proximaEjecucion ?? null),
            },
            {
              icon: GamepadIcon,
              label: "Juegos Hoy",
              value: String(status?.juegosHoy ?? 0),
            },
            {
              icon: Bot,
              label: "Total Agregados",
              value: String(status?.totalJuegosAgregados ?? 0),
            },
          ].map(({ icon: Icon, label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-green-800 rounded-lg p-4 bg-green-950/20"
            >
              <div className="flex items-center gap-2 text-green-600 text-xs uppercase tracking-widest mb-2">
                <Icon className="w-3 h-3" />
                {label}
              </div>
              <div className="text-green-300 text-xl font-bold">{value}</div>
            </motion.div>
          ))}
        </div>

        {/* Chart + Run Button */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* 7-day chart */}
          <div className="md:col-span-2 border border-green-800 rounded-lg p-4 bg-black/60">
            <div className="text-green-600 text-xs uppercase tracking-widest mb-4">
              {`>`} Juegos Agregados — Últimos 7 Días
            </div>
            {status?.stats7dias && status.stats7dias.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={status.stats7dias}>
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={formatDay}
                    tick={{ fill: "#4ade80", fontSize: 11 }}
                    axisLine={{ stroke: "#166534" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#4ade80", fontSize: 11 }}
                    axisLine={{ stroke: "#166534" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid #166534",
                      color: "#4ade80",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                    labelFormatter={(l: string) => formatDay(l)}
                    formatter={(v: number) => [`${v} juego(s)`, "Agregados"]}
                  />
                  <Bar dataKey="juegos" fill="#16a34a" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-green-700 text-sm">
                Sin datos aún
              </div>
            )}
          </div>

          {/* Run panel */}
          <div className="border border-green-800 rounded-lg p-6 bg-black/60 flex flex-col gap-4 justify-between">
            <div>
              <div className="text-green-600 text-xs uppercase tracking-widest mb-3">
                {`>`} Ejecución Manual
              </div>
              <p className="text-green-700 text-sm leading-relaxed">
                Ejecuta el agente ahora para obtener juegos trending, curarlos con Claude y generar noticias del día.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => void handleRun()}
                disabled={isExecuting}
                className="w-full bg-green-700 hover:bg-green-600 text-black font-bold tracking-widest uppercase border border-green-500 rounded transition-all disabled:opacity-50"
              >
                {isExecuting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Ejecutando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    ▶ Ejecutar Ahora
                  </span>
                )}
              </Button>

              <AnimatePresence>
                {runMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-start gap-2 text-xs p-3 rounded border ${
                      runMsg.ok
                        ? "border-green-700 bg-green-950/40 text-green-400"
                        : "border-red-800 bg-red-950/40 text-red-400"
                    }`}
                  >
                    {runMsg.ok ? (
                      <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    )}
                    {runMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Log terminal */}
        <div className="border border-green-800 rounded-lg bg-black/80">
          <div className="flex items-center justify-between px-4 py-2 border-b border-green-800">
            <span className="text-green-600 text-xs uppercase tracking-widest">
              {`>`} Log en Vivo
            </span>
            <span className="text-green-800 text-xs">
              {loading ? "Cargando..." : `${status?.ultimasLineasLog.length ?? 0} líneas`}
            </span>
          </div>
          <div
            ref={logRef}
            className="h-72 overflow-y-auto p-4 text-xs leading-relaxed scrollbar-thin scrollbar-track-black scrollbar-thumb-green-900"
          >
            {loading ? (
              <div className="text-green-700 animate-pulse">Conectando al sistema...</div>
            ) : status?.ultimasLineasLog && status.ultimasLineasLog.length > 0 ? (
              status.ultimasLineasLog.map((line, i) => (
                <div
                  key={i}
                  className={`${
                    line.includes("❌") || line.includes("ERROR")
                      ? "text-red-400"
                      : line.includes("✅") || line.includes("completado")
                      ? "text-green-300"
                      : "text-green-600"
                  } whitespace-pre-wrap break-all`}
                >
                  {line || "\u00A0"}
                </div>
              ))
            ) : (
              <div className="text-green-800">
                {`> Sin logs disponibles. Ejecuta el agente para empezar.`}
              </div>
            )}
            <div className="text-green-700 mt-2 animate-pulse">█</div>
          </div>
        </div>

        <div className="text-green-800 text-xs text-center">
          {`> `}Auto-refresh cada 10 segundos · Tick #{tick} · GameReviews Agente IA
        </div>
      </div>
    </div>
  );
}
