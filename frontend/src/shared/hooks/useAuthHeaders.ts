import { useMemo } from "react";
import { useAuth } from "@features/auth/context/AuthContext";

export function useAuthHeaders() {
  const { auth } = useAuth();
  const token = auth?.token;

  return useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );
}
