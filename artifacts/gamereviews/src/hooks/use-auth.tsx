import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiJson, parseApiJson, getApiErrorMessage } from "@/lib/api-fetch";
import { useUser } from "@/hooks/use-user";

export type AuthUser = {
  id: string;
  nombre: string;
  email: string;
  avatarUrl: string | null;
  fechaRegistro: string;
  rol: "user" | "admin" | string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (params: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  register: (params: {
    nombre: string;
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { setUserFromAuth } = useUser();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<AuthUser | null> => {
      const res = await apiFetch("/auth/me");
      if (res.status === 401) return null;
      const data = await parseApiJson<{ user?: AuthUser } & { error?: string }>(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, "No se pudo verificar la sesión"));
      }
      return data.user ?? null;
    },
    retry: false,
    staleTime: 60_000,
  });

  const applyUser = useCallback(
    (user: AuthUser) => {
      setUserFromAuth({
        nombre: user.nombre,
        avatarUrl: user.avatarUrl,
        fechaRegistro: user.fechaRegistro,
      });
      queryClient.setQueryData(["auth", "me"], user);
    },
    [setUserFromAuth, queryClient],
  );

  const loginMutation = useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => {
      const data = await apiJson<{ user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!data.user) throw new Error("Respuesta inválida del servidor");
      return data.user;
    },
    onSuccess: applyUser,
  });

  const registerMutation = useMutation({
    mutationFn: async (params: {
      nombre: string;
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => {
      const data = await apiJson<{ user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (!data.user) throw new Error("Respuesta inválida del servidor");
      return data.user;
    },
    onSuccess: applyUser,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiJson("/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isPending,
      isAdmin: meQuery.data?.rol === "admin",
      login: async (params) => {
        await loginMutation.mutateAsync(params);
      },
      register: async (params) => {
        await registerMutation.mutateAsync(params);
      },
      logout: async () => {
        await logoutMutation.mutateAsync();
      },
      refetch: async () => {
        await meQuery.refetch();
      },
    }),
    [meQuery, loginMutation, registerMutation, logoutMutation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
