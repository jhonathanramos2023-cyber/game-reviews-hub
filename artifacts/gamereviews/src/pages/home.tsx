import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import gamesData from "@/data/games.json";
import { GameCard } from "@/components/game-card";
import { useReviews } from "@/hooks/use-reviews";
import { useUser } from "@/hooks/use-user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Gamepad2, Users, MessageSquare, Dices, Bot, Newspaper, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopDealsStrip } from "@/components/top-deals-strip";
import { GameImage } from "@/components/game-image";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AgenteJuego {
  id: number;
  nombre: string;
  slug: string;
  descripcionCorta: string;
  imagen: string;
  generos: string[];
  plataformas: string[];
  rating: number;
  precio: number;
  fechaAgregado: string;
}

interface Noticia {
  id: string;
  titulo: string;
  resumen: string;
  categoria: string;
  urgente: boolean;
  fecha: string;
}

function useAgenteData() {
  const [juegos, setJuegos] = useState<AgenteJuego[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [lastRun, setLastRun] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [jRes, nRes, sRes] = await Promise.all([
          fetch(`${BASE}/api/agente/juegos`),
          fetch(`${BASE}/api/agente/noticias`),
          fetch(`${BASE}/api/agente/status`),
        ]);
        const jData = (await jRes.json()) as { juegosDe24h: AgenteJuego[] };
        const nData = (await nRes.json()) as { noticias: Noticia[] };
        const sData = (await sRes.json()) as { ultimaEjecucion: string | null };
        setJuegos(jData.juegosDe24h ?? []);
        setNoticias(nData.noticias ?? []);
        setLastRun(sData.ultimaEjecucion ?? null);
      } catch {
        /* silently skip if agent API not ready */
      }
    })();
  }, []);

  return { juegos, noticias, lastRun };
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 23) return `hace ${Math.floor(h / 24)} día(s)`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m} min`;
  return "hace un momento";
}

export default function Home() {
  const { reviews } = useReviews();
  const { user } = useUser();
  const { juegos: juegosDe24h, noticias, lastRun } = useAgenteData();
  const hasAgenteContent = juegosDe24h.length > 0 || noticias.length > 0;
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("todos");
  const [platform, setPlatform] = useState("todos");
  const [sort, setSort] = useState("rating");

  const goRandom = () => {
    const random = gamesData[Math.floor(Math.random() * gamesData.length)];
    setLocation(`/juego/${random.id}`);
  };

  // Derive stats
  const totalGames = gamesData.length;
  const totalReviews = reviews.length;
  const totalUsers = 12450 + (user ? 1 : 0); // Fake base number + local user

  // Extract unique genres and platforms
  const genres = useMemo(() => {
    const all = gamesData.flatMap(g => g.generos);
    return Array.from(new Set(all)).sort();
  }, []);

  const platforms = useMemo(() => {
    const all = gamesData.flatMap(g => g.plataformas);
    return Array.from(new Set(all)).sort();
  }, []);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let result = gamesData;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(g => 
        g.nombre.toLowerCase().includes(s) || 
        g.desarrollador.toLowerCase().includes(s)
      );
    }

    if (genre !== "todos") {
      result = result.filter(g => g.generos.includes(genre));
    }

    if (platform !== "todos") {
      result = result.filter(g => g.plataformas.includes(platform));
    }

    result.sort((a, b) => {
      if (sort === "rating") {
        const ratingA = reviews.filter(r => r.juegoId === a.id).reduce((acc, r, _, arr) => acc + r.rating / arr.length, 0) || a.rating;
        const ratingB = reviews.filter(r => r.juegoId === b.id).reduce((acc, r, _, arr) => acc + r.rating / arr.length, 0) || b.rating;
        return ratingB - ratingA;
      }
      if (sort === "precio") return a.precio - b.precio;
      if (sort === "az") return a.nombre.localeCompare(b.nombre);
      if (sort === "reciente") return new Date(b.fechaLanzamiento).getTime() - new Date(a.fechaLanzamiento).getTime();
      return 0;
    });

    return result;
  }, [search, genre, platform, sort, reviews]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-card/30 border border-border/50 p-8 md:p-16 flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="bg-background/50 backdrop-blur border-primary/30 text-primary mb-4 px-4 py-1 text-sm">
              La comunidad gaming definitiva
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-4">
              Descubre. <span className="text-primary">Juega.</span> Opina.
            </h1>
            <p className="text-xl text-muted-foreground">
              Explora nuestro catálogo curado, lee reseñas de la comunidad y crea tu lista personal.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center w-full max-w-2xl mx-auto mt-8 gap-3"
          >
            <div className="flex items-center w-full bg-background border border-border rounded-full p-2 pl-6 shadow-lg shadow-primary/5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              <input
                type="text"
                placeholder="Buscar juegos, desarrolladores..."
                className="flex-1 bg-transparent border-none outline-none text-lg h-12 min-w-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={goRandom}
              variant="outline"
              className="h-14 px-5 rounded-full border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground gap-2 shrink-0 w-full sm:w-auto"
            >
              <Dices className="h-5 w-5" />
              <span className="font-bold">Sorpréndeme</span>
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mt-8 pt-8 border-t border-border/50"
          >
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <Gamepad2 className="h-6 w-6 text-primary" />
                {totalGames}
              </div>
              <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Juegos</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <MessageSquare className="h-6 w-6 text-primary" />
                {totalReviews}
              </div>
              <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Reseñas</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-2xl font-display font-bold text-foreground">
                <Users className="h-6 w-6 text-primary" />
                {totalUsers.toLocaleString()}
              </div>
              <span className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Usuarios</span>
            </div>
          </motion.div>
        </div>
      </section>

      <TopDealsStrip />

      {/* Novedades de Hoy — AI Agent Section */}
      <AnimatePresence>
        {hasAgenteContent && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="w-6 h-6 text-primary" />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold">Novedades de Hoy</h2>
                {lastRun && (
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                    🤖 Actualizado {timeAgo(lastRun)}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin")}
                className="text-muted-foreground hover:text-primary text-xs gap-1"
              >
                <Zap className="w-3 h-3" />
                Panel IA
              </Button>
            </div>

            {/* Noticias */}
            {noticias.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {noticias.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card/60 border border-border rounded-xl p-4 space-y-2 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-primary shrink-0" />
                      <Badge
                        variant="outline"
                        className={`text-[10px] border-primary/30 ${
                          n.urgente ? "text-red-400 border-red-400/30" : "text-primary"
                        }`}
                      >
                        {n.urgente ? "🔴 URGENTE" : n.categoria}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm leading-snug">{n.titulo}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.resumen}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Juegos nuevos del agente */}
            {juegosDe24h.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  Claude seleccionó y describió estos juegos automáticamente hoy
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {juegosDe24h.map((juego, i) => (
                    <motion.div
                      key={juego.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all bg-card cursor-pointer"
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 font-bold">
                          NUEVO
                        </Badge>
                      </div>
                      <div className="aspect-[3/4] relative">
                        <GameImage
                          src={juego.imagen}
                          alt={juego.nombre}
                          fallbackTitle={juego.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3 space-y-1">
                        <h4 className="font-bold text-xs leading-snug line-clamp-2">{juego.nombre}</h4>
                        <p className="text-muted-foreground text-[10px] line-clamp-2">{juego.descripcionCorta}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {juego.generos.slice(0, 2).map((g) => (
                            <Badge key={g} variant="secondary" className="text-[9px] px-1 py-0">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Filters & Grid */}
      <section id="catalog" className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <span className="font-bold hidden md:inline">Filtros</span>
          </div>
          
          <div className="grid grid-cols-2 md:flex gap-4 w-full md:w-auto">
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full md:w-[180px] bg-background">
                <SelectValue placeholder="Género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los géneros</SelectItem>
                {genres.map(g => (
                  <SelectItem key={g} value={g} className="capitalize">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full md:w-[180px] bg-background">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las plataformas</SelectItem>
                {platforms.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full col-span-2 md:w-[180px] bg-background">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Mejor Valorados</SelectItem>
                <SelectItem value="reciente">Más Recientes</SelectItem>
                <SelectItem value="precio">Precio (Menor a Mayor)</SelectItem>
                <SelectItem value="az">A - Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredGames.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
            <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No se encontraron juegos</h3>
            <p className="text-muted-foreground">Intenta cambiar los filtros o el término de búsqueda.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setGenre("todos"); setPlatform("todos"); }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredGames.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
