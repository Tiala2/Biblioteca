/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@shared/api/http";
import {
  AUTH_EXPIRED_EVENT,
  clearStoredAuth,
  decodeRoles,
  getTokenExpirationMs,
  readStoredAuth,
  type StoredAuth,
  writeStoredAuth,
} from "@shared/auth/authStorage";
import { useToast } from "@shared/ui/toast/ToastContext";

type AuthState = StoredAuth;

type LoginResponse = {
  token: string;
  name: string;
  email: string;
};

type AuthContextType = {
  auth: AuthState | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [auth, setAuth] = useState<AuthState | null>(() => readStoredAuth());

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/api/v1/auth/login", { email, password });
    const next: AuthState = {
      token: data.token,
      email: data.email,
      name: data.name,
      roles: decodeRoles(data.token),
    };
    writeStoredAuth(next);
    setAuth(next);
  };

  const logout = () => {
    clearStoredAuth();
    setAuth(null);
  };

  useEffect(() => {
    const syncSession = () => setAuth(readStoredAuth());
    const expireSession = () => {
      setAuth(null);
      showToast("Sua sessao expirou. Faca login novamente.", "info");
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
    };
  }, [showToast]);

  useEffect(() => {
    if (!auth) return undefined;

    const expirationMs = getTokenExpirationMs(auth.token);
    if (expirationMs === null) return undefined;

    const delay = expirationMs - Date.now();
    if (delay <= 0) {
      clearStoredAuth({ notify: true });
      setAuth(null);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      clearStoredAuth({ notify: true });
      setAuth(null);
    }, Math.min(delay, 2_147_483_647));

    return () => window.clearTimeout(timeout);
  }, [auth, showToast]);

  useEffect(() => {
    if (!auth) {
      document.body.dataset.role = "guest";
      return;
    }

    const isAdmin = auth.roles.includes("ROLE_ADMIN");
    document.body.dataset.role = isAdmin ? "admin" : "user";
  }, [auth]);

  const value = useMemo(() => ({ auth, login, logout }), [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

