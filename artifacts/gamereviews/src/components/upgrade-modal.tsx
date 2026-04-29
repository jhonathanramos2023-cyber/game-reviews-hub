import { createContext, useContext, useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Crown } from "lucide-react";

interface UpgradeModalContextType {
  triggerUpgrade: (title: string, description: string, recommendedPlan?: "pro" | "elite") => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: "", description: "", recommendedPlan: "pro" });
  const [, setLocation] = useLocation();

  const triggerUpgrade = (title: string, description: string, recommendedPlan: "pro" | "elite" = "pro") => {
    setModalData({ title, description, recommendedPlan });
    setOpen(true);
  };

  return (
    <UpgradeModalContext.Provider value={{ triggerUpgrade }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center font-display text-2xl">{modalData.title}</DialogTitle>
            <DialogDescription className="text-center text-base">
              {modalData.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-stretch mt-4">
            <Button 
              className="w-full font-bold text-lg h-12"
              onClick={() => {
                setOpen(false);
                setLocation("/suscripcion");
              }}
            >
              Ver planes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (!context) {
    throw new Error("useUpgradeModal must be used within an UpgradeModalProvider");
  }
  return context;
}
