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

  /** Sync local profile after API login/register (single write — avoids stale closure in updateProfile). */
  const setUserFromAuth = (params: {
    nombre: string;
    avatarUrl?: string | null;
    fechaRegistro?: string | Date | null;
  }) => {
    const color =
      params.avatarUrl?.startsWith("#") === true
        ? params.avatarUrl
        : DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
    const fecha =
      params.fechaRegistro instanceof Date
        ? params.fechaRegistro.toISOString()
        : typeof params.fechaRegistro === "string"
          ? params.fechaRegistro
          : new Date().toISOString();

    setUser((prev) => ({
      nombre: params.nombre || "Gamer",
      bio: prev?.bio ?? "Soy un jugador apasionado.",
      avatarColor: color,
      fechaRegistro: fecha,
    }));
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
    setUser(null);
  };

  return { user, initUser, setUserFromAuth, updateProfile, clearData, colors: DEFAULT_COLORS };
}
