import { useLocalStorage } from "./use-local-storage";

export type Review = {
  id: string;
  juegoId: number;
  autor: string;
  rating: number;
  texto: string;
  recomendado: boolean;
  fecha: string;
  utilidad: number;
  esPropia: boolean;
};

export function useReviews() {
  const [reviews, setReviews] = useLocalStorage<Review[]>("gr_resenas", []);
  const [votes, setVotos] = useLocalStorage<string[]>("gr_votos", []);

  const addReview = (review: Omit<Review, "id" | "fecha" | "utilidad" | "esPropia">) => {
    const newReview: Review = {
      ...review,
      id: Math.random().toString(36).substr(2, 9),
      fecha: new Date().toISOString(),
      utilidad: 0,
      esPropia: true,
    };
    setReviews([newReview, ...reviews]);
  };

  const deleteReview = (id: string) => {
    setReviews(reviews.filter((r) => r.id !== id));
  };

  const getGameReviews = (juegoId: number) => {
    return reviews.filter((r) => r.juegoId === juegoId);
  };

  const voteReview = (id: string) => {
    if (votes.includes(id)) return false;
    
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, utilidad: r.utilidad + 1 } : r))
    );
    setVotos([...votes, id]);
    return true;
  };

  const hasVoted = (id: string) => votes.includes(id);

  return { reviews, addReview, deleteReview, getGameReviews, voteReview, hasVoted };
}
