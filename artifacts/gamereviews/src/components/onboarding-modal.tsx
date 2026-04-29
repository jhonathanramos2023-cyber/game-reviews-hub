import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

export function OnboardingModal() {
  const { user, initUser } = useUser();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    // Only open if user is strictly null (not loading)
    if (user === null) {
      setOpen(true);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initUser(name);
    setOpen(false);
  };

  if (user !== null) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        initUser("");
        setOpen(false);
      }
    }}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">Bienvenido a GameReviews</DialogTitle>
          <DialogDescription className="text-center text-base">
            El punto de encuentro para jugadores exigentes. ¿Cómo te llamamos?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            placeholder="Tu nombre de jugador"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-center text-lg bg-background"
            autoFocus
          />
          <DialogFooter className="sm:justify-stretch">
            <Button type="submit" className="w-full font-bold text-lg h-12">
              Entrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
