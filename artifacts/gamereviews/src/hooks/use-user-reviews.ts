import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, parseApiJson } from "@/lib/api-fetch";
import type { ApiReview } from "@/hooks/use-game-reviews";

export function useUserReviews(enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["resenas", "usuario", "me"],
    enabled,
    queryFn: async () => {
      const res = await apiFetch("/resenas/usuario/me");
      if (res.status === 401) throw new Error("No autenticado");
      if (!res.ok) throw new Error("Error al cargar reseñas");
      const data = await parseApiJson<{ resenas: ApiReview[] }>(res);
      return data.resenas ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/resenas/${id}`, { method: "DELETE" });
      const raw = await parseApiJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(raw.error ?? "Error al eliminar");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resenas"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      rating: number;
      texto: string;
      recomendado: boolean;
      plataforma: string;
    }) => {
      const res = await apiFetch(`/resenas/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          rating: params.rating,
          texto: params.texto,
          recomendado: params.recomendado,
          plataforma: params.plataforma,
        }),
      });
      const raw = await parseApiJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(raw.error ?? "Error al actualizar");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resenas"] });
    },
  });

  return {
    reviews: query.data ?? [],
    loading: query.isPending,
    error: query.isError,
    deleteReview: deleteMutation.mutateAsync,
    updateReview: updateMutation.mutateAsync,
    refetch: query.refetch,
  };
}
