import { useState, useEffect, useRef } from "react";
import { streamAi } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { usePlan } from "@/hooks/use-plan";
import { useUpgradeModal } from "./upgrade-modal";

interface AiAnalysisProps {
  systemPrompt: string;
  userPrompt: string;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  autoStart?: boolean;
}

export function AiAnalysis({ 
  systemPrompt, 
  userPrompt, 
  buttonText = "Analizar con IA",
  buttonIcon = <Sparkles className="h-4 w-4 mr-2" />,
  autoStart = false
}: AiAnalysisProps) {
  const { canUseAi, markAiUse } = usePlan();
  const { triggerUpgrade } = useUpgradeModal();
  
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  const startStream = async () => {
    if (isStreaming) return;
    
    if (!canUseAi()) {
      triggerUpgrade(
        "Límite de IA alcanzado", 
        "Con el plan Gratis puedes usar la IA 3 veces al día. Hazte PRO para tener análisis ilimitados."
      );
      return;
    }
    markAiUse();
    
    setContent("");
    setError(null);
    setIsStreaming(true);
    setIsDone(false);
    
    abortControllerRef.current = new AbortController();

    await streamAi(
      systemPrompt,
      userPrompt,
      {
        onChunk: (text) => {
          setContent((prev) => prev + text);
        },
        onDone: () => {
          setIsStreaming(false);
          setIsDone(true);
        },
        onError: (msg) => {
          setError(msg);
          setIsStreaming(false);
        },
      },
      abortControllerRef.current.signal
    );
  };

  useEffect(() => {
    if (autoStart && !isStreaming && !isDone && !error && !content) {
      startStream();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoStart]);

  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [content, isStreaming]);

  if (!content && !isStreaming && !error && !autoStart) {
    return (
      <Button 
        onClick={startStream} 
        className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 font-bold py-6 text-lg"
        variant="outline"
      >
        {buttonIcon}
        {buttonText}
      </Button>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2 text-primary font-display font-bold">
            <Sparkles className="h-5 w-5" />
            <span>Análisis IA</span>
          </div>
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generando...</span>
            </div>
          )}
        </div>
        
        {error ? (
          <div className="flex items-center gap-3 text-destructive p-4 bg-destructive/10 rounded-md">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
            <Button size="sm" variant="outline" className="ml-auto" onClick={startStream}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="prose prose-invert prose-p:leading-relaxed prose-headings:font-display prose-headings:text-primary max-w-none">
            {content.split("\n").map((line, i) => (
              <p key={i} className="mb-2 min-h-[1.5em] text-foreground/90">
                {line}
              </p>
            ))}
            {isStreaming && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block w-2 h-4 bg-primary ml-1 align-middle"
              />
            )}
            <div ref={contentEndRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
