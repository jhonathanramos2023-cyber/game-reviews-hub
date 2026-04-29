import { useState, useMemo } from "react";
import { Link } from "wouter";
import gamesData from "@/data/games.json";
import { useList, ListStatus } from "@/hooks/use-list";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stars } from "@/components/stars";
import { AiAnalysis } from "@/components/ai-analysis";
import { List, Play, Check, XSquare, Trash2, Clock, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STATUS_LABELS: Record<ListStatus, string> = {
  quiero_jugar: "Quiero Jugar",
  jugando: "Jugando",
  completado: "Completado",
  abandonado: "Abandonado"
};

const STATUS_ICONS: Record<ListStatus, React.ReactNode> = {
  quiero_jugar: <List className="h-4 w-4" />,
  jugando: <Play className="h-4 w-4" />,
  completado: <Check className="h-4 w-4" />,
  abandonado: <XSquare className="h-4 w-4" />
};

export default function MyList() {
  const { user } = useUser();
  const { list, updateItem, removeFromList } = useList();
  const [filter, setFilter] = useState<ListStatus | "todos">("todos");

  // Merge list data with full game data
  const enrichedList = useMemo(() => {
    type Game = (typeof gamesData)[number];
    return list
      .map((item) => {
        const game = gamesData.find((g) => g.id === item.juegoId);
        return game ? { ...item, game } : null;
      })
      .filter((x): x is typeof list[number] & { game: Game } => x !== null);
  }, [list]);

  const filteredList = enrichedList.filter(item => filter === "todos" || item.estado === filter);

  // Stats
  const stats = useMemo(() => {
    const counts = { quiero_jugar: 0, jugando: 0, completado: 0, abandonado: 0 };
    let totalHours = 0;
    
    list.forEach(item => {
      counts[item.estado]++;
      totalHours += item.horasJugadas || 0;
    });
    
    return { counts, totalHours };
  }, [list]);

  // Generate AI prompt for recommendations based on completed games
  const aiPrompt = useMemo(() => {
    const completed = enrichedList.filter(i => i.estado === "completado").map(i => i.game?.nombre);
    if (completed.length === 0) return "El usuario aún no ha completado ningún juego. Recomiéndale 3 juegos imprescindibles para empezar su colección, explicando por qué son obras maestras.";
    
    return `El usuario ha completado estos juegos y le gustaron: ${completed.join(", ")}. Basado en esto, recomiéndale 3 juegos específicos que debería jugar a continuación. Explica brevemente por qué le gustarán. Formato markdown.`;
  }, [enrichedList]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-display font-bold">Cargando perfil...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border border-border p-6 rounded-2xl">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary mb-2">Mi Biblioteca</h1>
          <p className="text-muted-foreground">
            Hola, <span className="font-bold text-foreground">{user.nombre}</span>. Tienes {list.length} juegos en tu lista.
          </p>
        </div>
        
        <div className="flex gap-4 items-center bg-background p-4 rounded-xl border border-border w-full md:w-auto">
          <div className="text-center px-4">
            <div className="text-2xl font-bold font-display text-primary">{stats.totalHours}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Horas jugadas</div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="text-center px-4">
            <div className="text-2xl font-bold font-display text-green-500">{stats.counts.completado}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Completados</div>
          </div>
        </div>
      </div>

      <AiAnalysis 
        systemPrompt="Eres un recomendador experto de videojuegos. Analizas los gustos del usuario y sugieres títulos ocultos o joyas reconocidas que encajen perfectamente."
        userPrompt={aiPrompt}
        buttonText="Recomiéndame un juego"
        buttonIcon={<Gamepad2 className="h-4 w-4 mr-2" />}
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-card h-auto p-1 rounded-xl mb-6">
          <TabsTrigger value="todos" className="py-2.5 rounded-lg text-sm font-bold">
            Todos ({list.length})
          </TabsTrigger>
          {(Object.entries(STATUS_LABELS) as [ListStatus, string][]).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">
              <span className="hidden sm:inline">{STATUS_ICONS[key]}</span>
              {label} ({stats.counts[key]})
            </TabsTrigger>
          ))}
        </TabsList>

        {filteredList.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed">
            <List className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Lista vacía</h3>
            <p className="text-muted-foreground">No hay juegos en esta categoría.</p>
            <Link href="/">
              <Button variant="outline" className="mt-4">Explorar juegos</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {filteredList.map((item, i) => (
                <motion.div
                  key={item.juegoId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-card/50 border-border overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <Link href={`/juego/${item.game.id}`} className="shrink-0">
                        <div className="relative w-full md:w-32 aspect-[3/1] md:aspect-[3/4]">
                          <img 
                            src={item.game.imagenBanner || item.game.imagen} 
                            alt={item.game.nombre} 
                            className="absolute inset-0 w-full h-full object-cover md:object-[center_20%]" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background/90 md:from-transparent to-transparent md:to-background/90" />
                        </div>
                      </Link>
                      
                      <CardContent className="p-4 md:p-6 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        <div className="md:col-span-4 space-y-2">
                          <Link href={`/juego/${item.game.id}`}>
                            <h3 className="font-bold text-lg hover:text-primary transition-colors inline-block">{item.game.nombre}</h3>
                          </Link>
                          
                          <div className="w-full pt-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase mb-1 block">Estado</label>
                            <Select 
                              value={item.estado} 
                              onValueChange={(v: ListStatus) => updateItem(item.juegoId, { estado: v })}
                            >
                              <SelectTrigger className="h-8 bg-background border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([k, l]) => (
                                  <SelectItem key={k} value={k}>{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="md:col-span-3 space-y-4">
                          <div>
                            <label className="text-xs text-muted-foreground font-bold uppercase mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Horas jugadas
                            </label>
                            <Input 
                              type="number" 
                              min="0"
                              className="h-8 bg-background border-border w-24" 
                              value={item.horasJugadas || ""}
                              onChange={(e) => updateItem(item.juegoId, { horasJugadas: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <label className="text-xs text-muted-foreground font-bold uppercase mb-1 block">Mi Nota</label>
                            <Stars 
                              rating={item.ratingPersonal || 0} 
                              onRating={(v) => updateItem(item.juegoId, { ratingPersonal: v })}
                              interactive
                            />
                          </div>
                        </div>

                        <div className="md:col-span-4 flex flex-col h-full">
                          <label className="text-xs text-muted-foreground font-bold uppercase mb-1 block">Notas personales</label>
                          <Textarea 
                            className="flex-1 min-h-[60px] resize-none bg-background border-border text-sm"
                            placeholder="Añade una nota..."
                            value={item.notaPersonal || ""}
                            onChange={(e) => updateItem(item.juegoId, { notaPersonal: e.target.value })}
                            onBlur={() => toast.success("Nota guardada")}
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end md:justify-center items-center h-full">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              removeFromList(item.juegoId);
                              toast("Juego eliminado de la lista");
                            }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Tabs>
    </div>
  );
}
