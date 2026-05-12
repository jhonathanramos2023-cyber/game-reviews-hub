import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./use-local-storage";

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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function useGameReviews(juegoId: number, juegoNombre: string) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useLocalStorage<string[]>("gr_votos_api", []);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE}/api/resenas/${juegoId}`);
      if (!res.ok) throw new Error("Error al cargar reseñas");
      const data = (await res.json()) as { resenas: ApiReview[] };
      setReviews(data.resenas);
    } catch {
      setError("No se pudieron cargar las reseñas");
    } finally {
      setLoading(false);
    }
  }, [juegoId]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const addReview = async (params: {
    autor: string;
    rating: number;
    texto: string;
    recomendado: boolean;
    plataforma: string;
  }) => {
    const res = await fetch(`${BASE}/api/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ juegoId, juegoNombre, ...params }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string; id?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al publicar reseña");
    await fetchReviews();
    return data.id;
  };

  const deleteReview = async (id: string, autor: string) => {
    const res = await fetch(`${BASE}/api/resenas/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autor }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Error al eliminar");
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const voteReview = async (id: string, usuarioHash: string) => {
    if (votes.includes(id)) return false;
    const res = await fetch(`${BASE}/api/resenas/${id}/utilidad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioHash }),
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!res.ok) return false;
    setVotes((prev) => [...prev, id]);
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, utilidad: r.utilidad + 1 } : r))
    );
    return true;
  };

  const hasVoted = (id: string) => votes.includes(id);

  const reviewsWithOwnership = (currentUser?: string) =>
    reviews.map((r) => ({
      ...r,
      esPropia: !!currentUser && r.autor === currentUser,
    }));

  return {
    reviews,
    loading,
    error,
    addReview,
    deleteReview,
    voteReview,
    hasVoted,
    reviewsWithOwnership,
    refetch: fetchReviews,
  };
}
