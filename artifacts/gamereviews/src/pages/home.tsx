import { useState, useMemo } from "react";
import gamesData from "@/data/games.json";
import { GameCard } from "@/components/game-card";
import { useReviews } from "@/hooks/use-reviews";
import { useUser } from "@/hooks/use-user";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Gamepad2, Users, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopDealsStrip } from "@/components/top-deals-strip";

export default function Home() {
  const { reviews } = useReviews();
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("todos");
  const [platform, setPlatform] = useState("todos");
  const [sort, setSort] = useState("rating");

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
            className="flex items-center w-full max-w-2xl mx-auto mt-8 bg-background border border-border rounded-full p-2 pl-6 shadow-lg shadow-primary/5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all"
          >
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <input
              type="text"
              placeholder="Buscar juegos, desarrolladores..."
              className="flex-1 bg-transparent border-none outline-none text-lg h-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
