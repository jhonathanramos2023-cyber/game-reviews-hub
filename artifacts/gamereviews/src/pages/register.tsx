import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) setLocation("/");
  }, [authLoading, user, setLocation]);

  if (!authLoading && user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-[70vh] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/40 backdrop-blur-xl shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-primary shadow-lg shadow-primary/30">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl bg-gradient-to-r from-violet-300 to-primary bg-clip-text text-transparent">
            Crear cuenta
          </CardTitle>
          <CardDescription>Únete con Google o Facebook en un solo clic</CardDescription>
        </CardHeader>
        <CardContent>
          <SocialAuthButtons />
          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
