import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "./use-local-storage";
import { apiFetch, parseApiJson } from "@/lib/api-fetch";

export type ApiReply = {
  id: string;
  resenaId: string;
  autor: string;
  texto: string;
  fecha: string;
};

export type ApiReview = {
  id: string;
  juegoId: number;
  juegoNombre: string;
  autor: string;
  rating: number;
  texto: string;
  recomendado: boolean;
  fecha: string;
  utilidad: number;
  plataforma: string;
  respuestaCount?: number;
  respuestas?: ApiReply[];
  esPropia?: boolean;
  puedeEliminar?: boolean;
};

export function useGameReviews(juegoId: number, juegoNombre: string) {
  const queryClient = useQueryClient();
  const [votes, setVotes] = useLocalStorage<string[]>("gr_votos_api", []);

  const enabled = Number.isFinite(juegoId) && juegoId > 0;

  const query = useQuery({
    queryKey: ["resenas", juegoId],
    enabled,
    staleTime: 0,
    refetchOnMount: true,
    queryFn: async () => {
      const res = await apiFetch(`/resenas/${juegoId}`);
      if (!res.ok) throw new Error("Error al cargar reseñas");
      return (await parseApiJson(res)) as { resenas: ApiReview[] };
    },
  });

  const addMutation = useMutation({
    mutationFn: async (params: {
      rating: number;
      texto: string;
      recomendado: boolean;
      plataforma: string;
    }) => {
      const nombre = juegoNombre.trim();
      const payload = {
        juegoId: Number(juegoId),
        juegoNombre: nombre,
        rating: Math.round(Number(params.rating)),
        texto: params.texto.trim(),
        recomendado: Boolean(params.recomendado),
        plataforma: (params.plataforma || "PC").trim(),
      };

      const res = await apiFetch("/resenas", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const raw = (await parseApiJson(res)) as {
        success?: boolean;
        error?: string;
        id?: string;
      };

      if (!res.ok) {
        throw new Error(
          typeof raw.error === "string" ? raw.error : "Error al publicar reseña",
        );
      }
      if (!raw.id || typeof raw.id !== "string") {
        throw new Error("Respuesta inválida del servidor");
      }
      return raw.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resenas", juegoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/resenas/${id}`, { method: "DELETE" });
      const raw = (await parseApiJson(res)) as { success?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(typeof raw.error === "string" ? raw.error : "Error al eliminar");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resenas", juegoId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ resenaId, texto }: { resenaId: string; texto: string }) => {
      const res = await apiFetch(`/resenas/${resenaId}/respuestas`, {
        method: "POST",
        body: JSON.stringify({ texto }),
      });
      const raw = (await parseApiJson(res)) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof raw.error === "string" ? raw.error : "Error al responder");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resenas", juegoId] });
    },
  });

  const addReview = useCallback(
    async (params: {
      rating: number;
      texto: string;
      recomendado: boolean;
      plataforma: string;
    }) => addMutation.mutateAsync(params),
    [addMutation],
  );

  const deleteReview = useCallback(
    async (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  const addReply = useCallback(
    async (resenaId: string, texto: string) =>
      replyMutation.mutateAsync({ resenaId, texto }),
    [replyMutation],
  );

  const voteReview = async (id: string, usuarioHash: string) => {
    if (votes.includes(id)) return false;
    const res = await apiFetch(`/resenas/${id}/utilidad`, {
      method: "POST",
      body: JSON.stringify({ usuarioHash }),
    });
    if (!res.ok) return false;
    setVotes((prev) => [...prev, id]);
    queryClient.setQueryData<{ resenas: ApiReview[] }>(["resenas", juegoId], (old) =>
      old
        ? {
            resenas: old.resenas.map((r) =>
              r.id === id ? { ...r, utilidad: r.utilidad + 1 } : r,
            ),
          }
        : old,
    );
    return true;
  };

  const hasVoted = (id: string) => votes.includes(id);

  const reviews = query.data?.resenas ?? [];

  const reviewsWithOwnership = (currentUser?: string, isAdmin?: boolean) =>
    reviews.map((r) => ({
      ...r,
      respuestaCount: r.respuestaCount ?? r.respuestas?.length ?? 0,
      esPropia: !!currentUser && r.autor === currentUser,
      puedeEliminar: !!currentUser && (r.autor === currentUser || isAdmin === true),
    }));

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    reviews,
    loading: enabled && query.isPending,
    error: query.isError ? "No se pudieron cargar las reseñas" : null,
    addReview,
    deleteReview,
    addReply,
    voteReview,
    hasVoted,
    reviewsWithOwnership,
    refetch,
  };
}
