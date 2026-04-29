import { usePlan, PlanType, LIMITES } from "@/hooks/use-plan";
import { useUser } from "@/hooks/use-user";
import { useList } from "@/hooks/use-list";
import { useReviews } from "@/hooks/use-reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Crown, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Subscription() {
  const { plan, setPlan, iaUsos } = usePlan();
  const { user } = useUser();
  const { list } = useList();
  const { reviews } = useReviews();
  
  const [confirmModal, setConfirmModal] = useState<{open: boolean, targetPlan?: PlanType}>({open: false});

  // Calculate usage
  const myReviewsThisMonth = user ? reviews.filter((r) => {
    if (r.autor !== user.nombre) return false;
    const d = new Date(r.fecha);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length : 0;

  const iaCount = iaUsos.date === new Date().toISOString().split("T")[0] ? iaUsos.count : 0;
  const listCount = list.length;

  const handleSubscribe = (targetPlan: PlanType) => {
    if (targetPlan === "gratis") {
      setPlan("gratis");
      toast("Plan cambiado a Gratis");
    } else {
      setConfirmModal({ open: true, targetPlan });
    }
  };

  const confirmSubscription = () => {
    if (confirmModal.targetPlan) {
      setPlan(confirmModal.targetPlan);
      toast.success(`¡Suscripción a ${confirmModal.targetPlan.toUpperCase()} activada!`);
      setConfirmModal({ open: false });
    }
  };

  const plans = [
    {
      id: "gratis" as PlanType,
      name: "Gratis",
      price: "$0",
      description: "Para jugadores casuales",
      features: [
        { included: true, text: "5 reseñas por mes" },
        { included: true, text: "Hasta 10 juegos en Mi Lista" },
        { included: true, text: "3 análisis de IA al día" },
        { included: false, text: "Historial de precios completo" },
        { included: false, text: "Alertas de rebajas" },
        { included: false, text: "Badge en tu perfil" },
      ],
    },
    {
      id: "pro" as PlanType,
      name: "PRO",
      price: "$4.99",
      period: "/mes",
      description: "Para verdaderos gamers",
      popular: true,
      features: [
        { included: true, text: "Reseñas ILIMITADAS" },
        { included: true, text: "Juegos ILIMITADOS en Mi Lista" },
        { included: true, text: "Análisis de IA ILIMITADOS" },
        { included: true, text: "Historial de precios completo" },
        { included: true, text: "Alertas de rebajas" },
        { included: true, text: "Badge PRO en tu perfil" },
        { included: false, text: "Reporte de datos mensual" },
      ],
    },
    {
      id: "elite" as PlanType,
      name: "Elite",
      price: "$9.99",
      period: "/mes",
      description: "Para los coleccionistas",
      features: [
        { included: true, text: "Todo lo del plan PRO" },
        { included: true, text: "Badge ELITE exclusivo" },
        { included: true, text: "Prioridad en análisis de IA" },
        { included: true, text: "Reporte mensual de tu librería" },
        { included: true, text: "Soporte prioritario" },
      ],
    }
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-display font-black text-primary">Elige tu plan GameReviews</h1>
        <p className="text-xl text-muted-foreground">Únete a la comunidad gamer más honesta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((p) => {
          const isCurrent = plan === p.id;
          return (
            <Card 
              key={p.id} 
              className={`relative bg-card flex flex-col ${
                p.popular ? 'border-primary shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)] scale-100 md:scale-105 z-10' : 'border-border'
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-sm shadow-md">
                    <Sparkles className="h-3 w-3 mr-1" /> Más popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-display font-bold">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold font-display">{p.price}</span>
                  {p.period && <span className="text-muted-foreground">{p.period}</span>}
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground"}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full font-bold text-lg h-12 ${isCurrent ? 'bg-muted text-muted-foreground hover:bg-muted' : ''}`}
                  variant={isCurrent ? "outline" : p.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(p.id)}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Plan actual" : "Suscribirme"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-16 bg-card border border-border p-6 rounded-2xl max-w-3xl mx-auto">
        <h3 className="text-2xl font-display font-bold mb-6">Tu uso actual</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-1 text-sm font-medium">
              <span>Reseñas este mes</span>
              <span>{myReviewsThisMonth} / {LIMITES[plan].resenasPorMes === Infinity ? '∞' : LIMITES[plan].resenasPorMes}</span>
            </div>
            <Progress value={LIMITES[plan].resenasPorMes === Infinity ? 0 : (myReviewsThisMonth / LIMITES[plan].resenasPorMes) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1 text-sm font-medium">
              <span>Análisis IA hoy</span>
              <span>{iaCount} / {LIMITES[plan].iaPorDia === Infinity ? '∞' : LIMITES[plan].iaPorDia}</span>
            </div>
            <Progress value={LIMITES[plan].iaPorDia === Infinity ? 0 : (iaCount / LIMITES[plan].iaPorDia) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1 text-sm font-medium">
              <span>Juegos en Mi Lista</span>
              <span>{listCount} / {LIMITES[plan].juegosEnLista === Infinity ? '∞' : LIMITES[plan].juegosEnLista}</span>
            </div>
            <Progress value={LIMITES[plan].juegosEnLista === Infinity ? 0 : (listCount / LIMITES[plan].juegosEnLista) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {plan !== "gratis" && (
        <div className="text-center mt-8">
          <Button variant="link" className="text-muted-foreground" onClick={() => handleSubscribe("gratis")}>
            Downgrade a plan Gratis (para pruebas)
          </Button>
        </div>
      )}

      <Dialog open={confirmModal.open} onOpenChange={(open) => !open && setConfirmModal({open: false})}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>Confirmar Suscripción</DialogTitle>
            <DialogDescription>
              Pago simulado por ahora — se activará cuando integremos Stripe.
              Al confirmar, se actualizará tu plan a {confirmModal.targetPlan?.toUpperCase()}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmModal({open: false})}>Cancelar</Button>
            <Button onClick={confirmSubscription} className="font-bold">Simular Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
