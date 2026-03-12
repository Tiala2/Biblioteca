import { Navigate } from "react-router-dom";
import { useAuth } from "@features/auth/context/AuthContext";

export function RoleRoute({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const { auth } = useAuth();
  if (!auth?.roles.includes(role)) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
