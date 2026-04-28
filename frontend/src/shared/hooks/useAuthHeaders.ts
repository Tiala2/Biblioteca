import { useMemo } from "react";
import { useAuth } from "@features/auth/context/AuthContext";

export function useAuthHeaders() {
  const { auth } = useAuth();

  return useMemo(
    () => (auth ? { Authorization: `Bearer ${auth.token}` } : undefined),
    [auth]
  );
}
