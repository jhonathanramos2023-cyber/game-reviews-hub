import { useEffect, useState } from "react";
import { fetchDealsForGame, fetchPriceHistory, DealsResponse, PriceHistoryResponse } from "@/lib/deals";
import { usePlan } from "@/hooks/use-plan";
import { useUpgradeModal } from "@/components/upgrade-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Tag, TrendingDown, ExternalLink, Lock } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DealsSectionProps {
  nombre: string;
  gameId?: string;
}

export function DealsSection({ nombre, gameId }: DealsSectionProps) {
  const { plan } = usePlan();
  const { triggerUpgrade } = useUpgradeModal();
  const [deals, setDeals] = useState<DealsResponse | null>(null);
  const [history, setHistory] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchDealsForGame(nombre);
      setDeals(data);
      if (data.gameId || gameId) {
        const hist = await fetchPriceHistory(data.gameId || gameId || "");
        setHistory(hist);
      }
      setLoading(false);
    }
    load();
  }, [nombre, gameId]);

  if (loading) {
    return (
      <div className="space-y-4 my-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!deals?.configured) {
    return (
      <div className="my-8 bg-card border border-border p-6 rounded-2xl text-center">
        <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="font-display font-bold text-lg mb-1">Ofertas</h3>
        <p className="text-muted-foreground">Precios no disponibles ahora mismo.</p>
      </div>
    );
  }

  if (!deals.found || deals.deals.length === 0) {
    return (
      <div className="my-8 bg-card border border-border p-6 rounded-2xl text-center">
        <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="font-display font-bold text-lg mb-1">Ofertas</h3>
        <p className="text-muted-foreground">No se encontraron ofertas para este juego.</p>
      </div>
    );
  }

  const chartData = history?.history
    ?.filter(h => h.price !== null)
    .map(h => ({
      date: new Date(h.timestamp).toLocaleDateString(),
      price: h.price
    })) || [];

  return (
    <div className="my-8 space-y-6">
      <h3 className="text-2xl font-display font-bold flex items-center gap-2">
        <Tag className="h-6 w-6 text-primary" />
        Ofertas Actuales
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {deals.deals.map((deal, i) => (
          <Card key={i} className="bg-card border-border overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Store className="h-5 w-5 text-muted-foreground" />
                <span className="font-bold">{deal.tienda}</span>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  {deal.enOferta ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#10b981] hover:bg-[#10b981] text-white">-{deal.descuento}%</Badge>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground line-through">${deal.precioOriginal}</span>
                        <span className="font-bold text-lg leading-none">${deal.precio}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="font-bold text-lg">${deal.precio}</span>
                  )}
                </div>
                <Button asChild size="sm" className="font-bold">
                  <a href={deal.url} target="_blank" rel="noopener noreferrer">
                    Ver oferta <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h4 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
          <TrendingDown className="h-5 w-5 text-primary" />
          Historial de Precios
        </h4>
        <Card className="bg-card border-border p-4 relative overflow-hidden">
          {plan === "gratis" ? (
            <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/50 flex flex-col items-center justify-center">
              <Lock className="h-8 w-8 text-primary mb-2" />
              <h5 className="font-bold text-lg mb-2">Análisis de precios bloqueado</h5>
              <Button 
                onClick={() => triggerUpgrade("Funcionalidad PRO", "El historial de precios es una función exclusiva para usuarios PRO y Elite.")}
                className="font-bold"
              >
                Desbloquea con PRO
              </Button>
            </div>
          ) : null}
          
          <div className="h-[200px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value}`, 'Precio']}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Historial no disponible
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
