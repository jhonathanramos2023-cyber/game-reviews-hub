import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Gamepad2, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative mb-6"
      >
        <Gamepad2 className="h-24 w-24 text-primary opacity-90" />
        <div className="absolute inset-0 blur-3xl bg-primary/30 -z-10" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="font-display text-6xl md:text-7xl font-black tracking-tight mb-2"
      >
        ERROR <span className="text-primary">404</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg text-muted-foreground max-w-md mb-8"
      >
        Esta página no existe en el universo GameReviews. Quizás la han desbloqueado en un DLC futuro.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link href="/">
          <Button size="lg" className="font-bold gap-2">
            <Home className="h-5 w-5" />
            Volver al inicio
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
