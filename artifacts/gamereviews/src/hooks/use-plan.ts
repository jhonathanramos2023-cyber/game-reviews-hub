import { useLocalStorage } from "./use-local-storage";
import { useReviews } from "./use-reviews";
import { useList } from "./use-list";
import { useUser } from "./use-user";

export type PlanType = "gratis" | "pro" | "elite";

export const LIMITES = {
  gratis: {
    resenasPorMes: 5,
    juegosEnLista: 10,
    iaPorDia: 3,
  },
  pro: {
    resenasPorMes: Infinity,
    juegosEnLista: Infinity,
    iaPorDia: Infinity,
  },
  elite: {
    resenasPorMes: Infinity,
    juegosEnLista: Infinity,
    iaPorDia: Infinity,
  },
};

export function usePlan() {
  const [plan, setPlanState] = useLocalStorage<PlanType>("gr_plan", "gratis");
  const [, setPlanFecha] = useLocalStorage<string>("gr_plan_fecha", new Date().toISOString());
  const [iaUsos, setIaUsos] = useLocalStorage<{ date: string; count: number }>("gr_ia_usos", {
    date: new Date().toISOString().split("T")[0],
    count: 0,
  });

  const { reviews } = useReviews();
  const { list } = useList();
  const { user } = useUser();

  const setPlan = (newPlan: PlanType) => {
    setPlanState(newPlan);
    setPlanFecha(new Date().toISOString());
  };

  const getPlan = () => plan;

  const canWriteReview = () => {
    if (plan !== "gratis") return true;
    if (!user) return false;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const myReviewsThisMonth = reviews.filter((r) => {
      if (r.autor !== user.nombre) return false;
      const d = new Date(r.fecha);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    return myReviewsThisMonth.length < LIMITES.gratis.resenasPorMes;
  };

  const canUseAi = () => {
    if (plan !== "gratis") return true;
    const today = new Date().toISOString().split("T")[0];
    if (iaUsos.date !== today) {
      setIaUsos({ date: today, count: 0 });
      return true; // Still have uses
    }
    return iaUsos.count < LIMITES.gratis.iaPorDia;
  };

  const markAiUse = () => {
    const today = new Date().toISOString().split("T")[0];
    if (iaUsos.date !== today) {
      setIaUsos({ date: today, count: 1 });
    } else {
      setIaUsos({ date: today, count: iaUsos.count + 1 });
    }
  };

  const canAddToList = () => {
    if (plan !== "gratis") return true;
    return list.length < LIMITES.gratis.juegosEnLista;
  };

  return {
    plan,
    setPlan,
    getPlan,
    canWriteReview,
    canUseAi,
    markAiUse,
    canAddToList,
    iaUsos,
  };
}
