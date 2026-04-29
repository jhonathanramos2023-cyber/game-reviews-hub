import { useMemo } from "react";
import { Link } from "wouter";
import gamesData from "@/data/games.json";
import { useReviews } from "@/hooks/use-reviews";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/stars";
import { Trophy, Medal, Flame, Star, MessageSquare, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AiAnalysis } from "@/components/ai-analysis";

export default function Ranking() {
  const { reviews } = useReviews();

  // Calculate stats
  const gameStats = useMemo(() => {
    return gamesData.map(game => {
      const gameReviews = reviews.filter(r => r.juegoId === game.id);
      const avgRating = gameReviews.length > 0 
        ? gameReviews.reduce((acc, r) => acc + r.rating, 0) / gameReviews.length 
        : game.rating;
      
      return {
        ...game,
        reviewCount: gameReviews.length,
        avgRating,
        score: avgRating * Math.log10(gameReviews.length + 10) // Simple hotness score
      };
    });
  }, [reviews]);

  const topRated = [...gameStats].sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
  const topReviewed = [...gameStats].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 10);
  const topHot = [...gameStats].sort((a, b) => b.score - a.score).slice(0, 10);

  const renderPodium = (games: typeof gameStats) => {
    if (games.length < 3) return null;
    
    const podium = [
      { game: games[1], place: 2, color: "bg-zinc-400", border: "border-zinc-400", height: "h-32" },
      { game: games[0], place: 1, color: "bg-yellow-500", border: "border-yellow-500", height: "h-40" },
      { game: games[2], place: 3, color: "bg-amber-700", border: "border-amber-700", height: "h-24" },
    ];

    return (
      <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 mt-8 px-2">
        {podium.map((p, i) => (
          <motion.div 
            key={p.game.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
            className="flex flex-col items-center w-28 md:w-40"
          >
            <Link href={`/juego/${p.game.id}`}>
              <div className={`relative mb-4 rounded-xl overflow-hidden border-4 cursor-pointer hover:scale-105 transition-transform shadow-lg ${p.border}`}>
                <div className={`absolute top-0 right-0 ${p.color} text-black font-black w-8 h-8 flex items-center justify-center rounded-bl-xl z-10`}>
                  #{p.place}
                </div>
                <img src={p.game.imagen} alt={p.game.nombre} className="w-full aspect-[3/4] object-cover" />
              </div>
            </Link>
            <div className="text-center font-bold text-sm md:text-base line-clamp-2 mb-2 h-10 px-1">
              {p.game.nombre}
            </div>
            <div className={`w-full ${p.color} ${p.height} rounded-t-lg flex flex-col items-center justify-start pt-4 text-black opacity-80`}>
              <div className="font-black text-xl md:text-3xl">{p.place}</div>
              <div className="flex items-center gap-1 font-bold mt-2">
                <Star className="h-4 w-4 fill-black" /> {p.game.avgRating.toFixed(1)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderList = (games: typeof gameStats) => {
    return (
      <div className="flex flex-col gap-3">
        {games.slice(3).map((game, index) => (
          <motion.div 
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/juego/${game.id}`}>
              <Card className="bg-card/50 border-border hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden">
                <div className="flex items-center p-0">
                  <div className="w-12 md:w-16 font-display font-bold text-xl md:text-2xl text-center text-muted-foreground bg-background/50 h-full py-4 md:py-6">
                    #{index + 4}
                  </div>
                  <img src={game.imagen} alt={game.nombre} className="w-16 md:w-20 aspect-square object-cover" />
                  <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-lg leading-none mb-1">{game.nombre}</h4>
                      <div className="text-xs text-muted-foreground">{game.generos.join(", ")}</div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-primary font-bold">
                          <Star className="h-4 w-4 fill-current" /> {game.avgRating.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {game.reviewCount} res.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    );
  };

  const aiRankingPrompt = `Basado en este top 3 de juegos (1. ${topRated[0]?.nombre}, 2. ${topRated[1]?.nombre}, 3. ${topRated[2]?.nombre}), escribe un breve análisis del estado actual del gaming. ¿Qué dice este top sobre los gustos de los jugadores? Sé analítico y usa tono de experto.`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-black text-primary flex items-center justify-center gap-4">
          <Trophy className="h-10 w-10 md:h-12 md:w-12" />
          Rankings
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Los mejores juegos según la comunidad. Basado en {reviews.length} reseñas reales.
        </p>
      </div>

      <AiAnalysis 
        systemPrompt="Eres un analista de la industria de los videojuegos. Analizas tendencias basadas en datos de rankings."
        userPrompt={aiRankingPrompt}
        buttonText="Análisis IA del Ranking"
        buttonIcon={<TrendingUp className="h-4 w-4 mr-2" />}
      />

      <Tabs defaultValue="valorados" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-3 bg-card h-14 p-1 rounded-xl">
          <TabsTrigger value="valorados" className="rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Star className="h-4 w-4 mr-2" /> Top Valorados
          </TabsTrigger>
          <TabsTrigger value="resenados" className="rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <MessageSquare className="h-4 w-4 mr-2" /> Top Reseñados
          </TabsTrigger>
          <TabsTrigger value="hot" className="rounded-lg text-sm md:text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Flame className="h-4 w-4 mr-2" /> Tendencia
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-8 bg-card border border-border rounded-3xl p-4 md:p-8">
          <TabsContent value="valorados" className="m-0 focus-visible:outline-none">
            {renderPodium(topRated)}
            {renderList(topRated)}
          </TabsContent>
          <TabsContent value="resenados" className="m-0 focus-visible:outline-none">
            {renderPodium(topReviewed)}
            {renderList(topReviewed)}
          </TabsContent>
          <TabsContent value="hot" className="m-0 focus-visible:outline-none">
            {renderPodium(topHot)}
            {renderList(topHot)}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
