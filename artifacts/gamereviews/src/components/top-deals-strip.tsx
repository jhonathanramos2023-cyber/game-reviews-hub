import { useEffect, useState } from "react";
import { fetchTopDeals, TopDealsResponse } from "@/lib/deals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Tag } from "lucide-react";
import { GameImage } from "./game-image";

export function TopDealsStrip() {
  const [topDeals, setTopDeals] = useState<TopDealsResponse | null>(null);

  useEffect(() => {
    fetchTopDeals().then(setTopDeals);
  }, []);

  if (!topDeals?.configured || !topDeals.list || topDeals.list.length === 0) {
    return null; // Gracefully hide if not configured or no deals
  }

  const deals = topDeals.list.slice(0, 8);

  return (
    <section className="space-y-6">
      <div className="flex flex-col text-center sm:text-left sm:flex-row items-center gap-2">
        <h2 className="text-3xl font-display font-bold flex items-center gap-2">
          <Tag className="h-8 w-8 text-primary" /> En oferta ahora
        </h2>
        <span className="text-muted-foreground text-sm mt-1 sm:ml-4 sm:mt-2">Mejores descuentos del momento</span>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 snap-x">
        {deals.map((item, i) => (
          <Card key={item.id || i} className="bg-card border-border shrink-0 w-[260px] sm:w-auto snap-center flex flex-col overflow-hidden">
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <GameImage 
                src={item.assets?.banner400 || item.assets?.boxart || ""} 
                alt={item.title || "Game"}
                fallbackTitle={item.title || "Game"}
                className="w-full h-full object-cover"
              />
              {item.deal?.cut && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[#10b981] hover:bg-[#10b981] text-white font-bold text-sm">
                    -{item.deal.cut}%
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4 flex flex-col flex-1 justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-1">{item.title}</h3>
                <span className="text-xs text-muted-foreground font-medium">{item.deal?.shop?.name}</span>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  {item.deal?.regular?.amount && item.deal.cut && item.deal.cut > 0 ? (
                    <span className="text-xs text-muted-foreground line-through">${item.deal.regular.amount.toFixed(2)}</span>
                  ) : <span className="h-4"></span>}
                  <span className="font-bold text-xl text-primary leading-none">${item.deal?.price?.amount?.toFixed(2) || "0.00"}</span>
                </div>
                <Button asChild size="sm" className="font-bold rounded-full w-8 h-8 p-0">
                  <a href={item.deal?.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
