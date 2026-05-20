import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { Link } from "wouter";

const DISMISS_KEY = "gr_onboarding_welcome_seen";

/** Bienvenida una sola vez; el nombre viene del login/registro. */
export function OnboardingModal() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setOpen(false);
      return;
    }
    try {
      if (typeof window !== "undefined" && !window.localStorage.getItem(DISMISS_KEY)) {
        setOpen(true);
      }
    } catch {
      /* private mode */
      setOpen(true);
    }
  }, [loading, user]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (loading || user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">Bienvenido a GameReviews</DialogTitle>
          <DialogDescription className="text-center text-base">
            El punto de encuentro para jugadores exigentes. Para guardar lista, perfil y reseñas, usa tu
            cuenta.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login" onClick={dismiss}>
              Iniciar sesión
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/register" onClick={dismiss}>
              Crear cuenta
            </Link>
          </Button>
          <Button type="button" className="w-full font-bold text-lg h-12" onClick={dismiss}>
            Continuar sin cuenta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
