import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Loader2 } from "lucide-react";
import type { ApiReply } from "@/hooks/use-game-reviews";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

type Props = {
  resenaId: string;
  respuestaCount: number;
  respuestas: ApiReply[];
  onReply: (resenaId: string, texto: string) => Promise<void>;
};

export function ReviewReplies({ resenaId, respuestaCount, respuestas, onReply }: Props) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleResponder = () => {
    if (!user) {
      const redirect = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/",
      );
      setLocation(`/login?redirect=${redirect}`);
      return;
    }
    setOpen((v) => !v);
  };

  const handleSubmit = async () => {
    if (texto.trim().length < 2) return;
    setSubmitting(true);
    try {
      await onReply(resenaId, texto.trim());
      setTexto("");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-primary"
        onClick={handleResponder}
      >
        <MessageSquare className="h-4 w-4" />
        Responder
        {respuestaCount > 0 && (
          <span className="text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
            {respuestaCount}
          </span>
        )}
      </Button>

      {open && user && (
        <div className="space-y-2 pl-2 border-l-2 border-primary/40">
          <Textarea
            placeholder="Escribe tu respuesta…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-[80px] bg-background/80 focus-visible:ring-primary"
          />
          <Button size="sm" disabled={submitting || texto.trim().length < 2} onClick={() => void handleSubmit()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar respuesta"}
          </Button>
        </div>
      )}

      {respuestas.length > 0 && (
        <div className="space-y-2 pl-4">
          {respuestas.map((r) => (
            <div
              key={r.id}
              className="rounded-lg bg-muted/40 border border-border/50 p-3 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                    {r.autor.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-foreground/90">{r.autor}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(r.fecha).toLocaleDateString("es-ES")}
                </span>
              </div>
              <p className="text-foreground/85 whitespace-pre-wrap">{r.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
