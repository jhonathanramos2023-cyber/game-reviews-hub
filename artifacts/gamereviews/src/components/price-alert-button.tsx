import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { usePlan } from "@/hooks/use-plan";
import { useUpgradeModal } from "./upgrade-modal";
import { toast } from "sonner";

interface PriceAlertButtonProps {
  juegoId: number;
  nombreJuego: string;
}

export function PriceAlertButton({ juegoId, nombreJuego }: PriceAlertButtonProps) {
  const [alertas, setAlertas] = useLocalStorage<{juegoId: number; nombreJuego: string; fechaActivada: string}[]>("gr_alertas", []);
  const { plan } = usePlan();
  const { triggerUpgrade } = useUpgradeModal();

  const isAlertActive = alertas.some(a => a.juegoId === juegoId);

  const toggleAlert = () => {
    if (plan === "gratis") {
      triggerUpgrade(
        "Alertas de Precio", 
        "Las alertas de precio son una función exclusiva para usuarios PRO. Recibe notificaciones cuando tus juegos favoritos bajen de precio."
      );
      return;
    }

    if (isAlertActive) {
      setAlertas(alertas.filter(a => a.juegoId !== juegoId));
      toast("Alerta desactivada", { description: `Ya no recibirás alertas para ${nombreJuego}` });
    } else {
      setAlertas([...alertas, { juegoId, nombreJuego, fechaActivada: new Date().toISOString() }]);
      toast.success("Alerta activada", { description: `Te avisaremos cuando ${nombreJuego} baje de precio` });
    }
  };

  return (
    <Button 
      variant={isAlertActive ? "default" : "outline"} 
      className={`font-bold gap-2 ${isAlertActive ? 'bg-primary text-primary-foreground' : 'border-primary text-primary'}`}
      onClick={toggleAlert}
    >
      <Bell className={`h-4 w-4 ${isAlertActive ? 'fill-current' : ''}`} />
      {isAlertActive ? "Alerta Activa" : "Crear Alerta"}
    </Button>
  );
}
