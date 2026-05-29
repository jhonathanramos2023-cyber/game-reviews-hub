import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SocialAuthButtons } from "@/components/social-auth-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getRedirectTarget(): string {
  if (typeof window === "undefined") return "/";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("redirect");
  if (!raw) return "/";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch {
    /* ignore */
  }
  return "/";
}

const OAUTH_ERRORS: Record<string, string> = {
  invalid_state: "Sesión OAuth inválida. Inténtalo de nuevo.",
  token_failed: "No se pudo completar el inicio con el proveedor.",
  profile_failed: "No se pudo obtener tu perfil.",
  email_required: "Se requiere un email verificado en tu cuenta.",
  server_error: "Error del servidor durante el inicio social.",
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [oauthError, setOauthError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oauth_error");
    if (code) {
      setOauthError(OAUTH_ERRORS[code] ?? "Error al iniciar sesión social.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) setLocation(getRedirectTarget());
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-[100px]" />
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/40 backdrop-blur-xl shadow-2xl shadow-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl bg-gradient-to-r from-primary to-violet-300 bg-clip-text text-transparent">
            Iniciar sesión
          </CardTitle>
          <CardDescription>Accede con tu cuenta de Google o Facebook</CardDescription>
        </CardHeader>
        <CardContent>
          {oauthError && (
            <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              {oauthError}
            </p>
          )}
          <SocialAuthButtons />
          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
