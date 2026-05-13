import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "./use-local-storage";
import { resolveApiUrl } from "@/lib/api-base";

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
  esPropia?: boolean;
};

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Respuesta inválida del servidor");
  }
}

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
      const res = await fetch(resolveApiUrl(`/resenas/${juegoId}`), { cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar reseñas");
      return (await parseJsonSafe(res)) as { resenas: ApiReview[] };
    },
  });

  const addMutation = useMutation({
    mutationFn: async (params: {
      autor: string;
      rating: number;
      texto: string;
      recomendado: boolean;
      plataforma: string;
    }) => {
      const nombre = juegoNombre.trim();
      const payload = {
        juegoId: Number(juegoId),
        juegoNombre: nombre,
        autor: params.autor.trim(),
        rating: Math.round(Number(params.rating)),
        texto: params.texto.trim(),
        recomendado: Boolean(params.recomendado),
        plataforma: (params.plataforma || "PC").trim(),
      };

      const res = await fetch(resolveApiUrl("/resenas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const raw = (await parseJsonSafe(res)) as {
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
    onSuccess: (newId, variables) => {
      const nombre = juegoNombre.trim();
      queryClient.setQueryData<{ resenas: ApiReview[] }>(
        ["resenas", juegoId],
        (old) => {
          const list = old?.resenas ?? [];
          const nuevo: ApiReview = {
            id: newId,
            juegoId,
            juegoNombre: nombre,
            autor: variables.autor,
            rating: variables.rating,
            texto: variables.texto,
            recomendado: variables.recomendado,
            fecha: new Date().toISOString(),
            utilidad: 0,
            plataforma: variables.plataforma,
          };
          return {
            resenas: [nuevo, ...list.filter((r) => r.id !== nuevo.id)],
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ["resenas", juegoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, autor }: { id: string; autor: string }) => {
      const res = await fetch(resolveApiUrl(`/resenas/${id}`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ autor }),
      });
      const raw = (await parseJsonSafe(res)) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          typeof raw.error === "string" ? raw.error : "Error al eliminar",
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resenas", juegoId] });
    },
  });

  const addReview = useCallback(
    async (params: {
      autor: string;
      rating: number;
      texto: string;
      recomendado: boolean;
      plataforma: string;
    }) => {
      return addMutation.mutateAsync(params);
    },
    [addMutation],
  );

  const deleteReview = useCallback(
    async (id: string, autor: string) => {
      await deleteMutation.mutateAsync({ id, autor });
    },
    [deleteMutation],
  );

  const voteReview = async (id: string, usuarioHash: string) => {
    if (votes.includes(id)) return false;
    const res = await fetch(resolveApiUrl(`/resenas/${id}/utilidad`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ usuarioHash }),
    });
    const raw = (await parseJsonSafe(res)) as { success?: boolean; error?: string };
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

  const reviewsWithOwnership = (currentUser?: string) =>
    reviews.map((r) => ({
      ...r,
      esPropia: !!currentUser && r.autor === currentUser,
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
    voteReview,
    hasVoted,
    reviewsWithOwnership,
    refetch,
  };
}
