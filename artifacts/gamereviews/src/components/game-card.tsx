import { Link } from "wouter";
import { Plus, Check, Play, X, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useList, ListStatus } from "@/hooks/use-list";
import { useReviews } from "@/hooks/use-reviews";
import { usePlan } from "@/hooks/use-plan";
import { useUpgradeModal } from "./upgrade-modal";
import { motion } from "framer-motion";
import { Stars } from "./stars";
import { GameImage } from "./game-image";

interface GameCardProps {
  game: any;
  index: number;
}

export function GameCard({ game, index }: GameCardProps) {
  const { list, addToList, removeFromList } = useList();
  const { getGameReviews } = useReviews();
  const { canAddToList } = usePlan();
  const { triggerUpgrade } = useUpgradeModal();

  const listItem = list.find((i) => i.juegoId === game.id);
  const inList = !!listItem;
  const reviews = getGameReviews(game.id);
  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : game.rating;

  const handleToggleList = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inList) {
      removeFromList(game.id);
    } else {
      if (!canAddToList()) {
        triggerUpgrade(
          "Límite de juegos alcanzado", 
          "Con el plan Gratis puedes añadir hasta 10 juegos a tu lista. Hazte PRO para tener una lista ilimitada."
        );
        return;
      }
      addToList(game.id, "quiero_jugar");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/juego/${game.id}`}>
        <Card className="group overflow-hidden bg-card/50 border-primary/10 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.3)] cursor-pointer h-full flex flex-col relative">
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant={inList ? "default" : "secondary"}
              size="icon"
              className={`h-8 w-8 rounded-full ${inList ? "bg-primary hover:bg-destructive" : "bg-background/80 hover:bg-primary"} backdrop-blur transition-all duration-300`}
              onClick={handleToggleList}
            >
              {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="relative aspect-[3/4] overflow-hidden">
            <GameImage
              src={game.imagen}
              alt={game.nombre}
              fallbackTitle={game.nombre}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-display font-bold text-lg leading-tight mb-1 line-clamp-2">
                {game.nombre}
              </h3>
              <div className="flex flex-wrap gap-1 mb-2">
                {game.generos.slice(0, 2).map((g: string) => (
                  <Badge key={g} variant="outline" className="bg-background/50 backdrop-blur text-[10px] px-1 py-0 border-primary/30 uppercase tracking-wider">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 flex-grow flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Stars rating={avgRating} max={1} />
                <span className="font-bold text-sm">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-xs ml-1">({reviews.length})</span>
              </div>
              <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                MC: {game.ratingMetacritic}
              </div>
            </div>
            
            <div className="flex items-end justify-between mt-auto">
              <div>
                {game.descuento > 0 ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="px-1 py-0 text-xs">-{game.descuento}%</Badge>
                    <span className="font-bold text-lg text-primary">${game.precio}</span>
                  </div>
                ) : (
                  <span className="font-bold text-lg text-primary">
                    {game.precio === 0 ? "Gratis" : `$${game.precio}`}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{game.plataforma}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
