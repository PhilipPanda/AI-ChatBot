import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { authApi, tokenStore, userApi } from "../lib/api";
import type { User } from "../lib/types";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; name?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (!tokenStore.get()) {
          await authApi.refresh();
        }

        if (tokenStore.get()) {
          const me = await userApi.getMe();
          setUser(me);
        }
      } catch {
        tokenStore.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme ?? "dark";
  }, [user?.theme]);

  const login: AuthContextValue["login"] = async (payload) => {
    await authApi.login(payload);
    const me = await userApi.getMe();
    setUser(me);
  };

  const register: AuthContextValue["register"] = async (payload) => {
    await authApi.register(payload);
    const me = await userApi.getMe();
    setUser(me);
  };

  const logout: AuthContextValue["logout"] = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshUser: AuthContextValue["refreshUser"] = async () => {
    const me = await userApi.getMe();
    setUser(me);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      logout,
      refreshUser,
      setUser
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
