import { AuthProvider } from "@features/auth/context/AuthContext";
import { ErrorBoundary } from "@shared/ui/feedback/ErrorBoundary";
import { ApiStatusBanner } from "@shared/ui/feedback/ApiStatusBanner";
import { ThemeProvider } from "@shared/ui/theme/ThemeContext";
import { ToastProvider } from "@shared/ui/toast/ToastContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <ApiStatusBanner />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

