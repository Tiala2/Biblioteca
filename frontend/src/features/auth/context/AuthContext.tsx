/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@shared/api/http";

type AuthState = {
  token: string;
  email: string;
  name: string;
  roles: string[];
};

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
const STORAGE_KEY = "library.auth";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function decodeRoles(token: string): string[] {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  return Array.isArray(payload.roles) ? payload.roles.filter((role): role is string => typeof role === "string") : [];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthState;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    const { data } = await api.post<LoginResponse>("/api/v1/auth/login", { email, password });
    const next: AuthState = {
      token: data.token,
      email: data.email,
      name: data.name,
      roles: decodeRoles(data.token),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  };

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

