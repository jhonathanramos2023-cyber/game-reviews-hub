import { useLocalStorage } from "./use-local-storage";

export type User = {
  nombre: string;
  bio: string;
  avatarColor: string;
  fechaRegistro: string;
};

const DEFAULT_COLORS = [
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
];

export function useUser() {
  const [user, setUser] = useLocalStorage<User | null>("gr_usuario", null);

  const initUser = (nombre: string) => {
    setUser({
      nombre: nombre || "Gamer",
      bio: "Soy un jugador apasionado.",
      avatarColor: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
      fechaRegistro: new Date().toISOString(),
    });
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const clearData = () => {
    window.localStorage.removeItem("gr_usuario");
    window.localStorage.removeItem("gr_lista");
    window.localStorage.removeItem("gr_resenas");
    window.localStorage.removeItem("gr_votos");
    window.location.reload();
  };

  return { user, initUser, updateProfile, clearData, colors: DEFAULT_COLORS };
}
