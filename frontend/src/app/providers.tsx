import { AuthProvider } from "@features/auth/context/AuthContext";
import { ThemeProvider } from "@shared/ui/theme/ThemeContext";
import { ToastProvider } from "@shared/ui/toast/ToastContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

