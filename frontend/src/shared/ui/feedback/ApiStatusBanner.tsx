import { useEffect, useState } from "react";
import { API_BASE_URL } from "@shared/api/http";

type ApiStatus = "checking" | "online" | "offline";

function healthUrl() {
  return `${API_BASE_URL.replace(/\/$/, "")}/actuator/health`;
}

export function ApiStatusBanner() {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let active = true;
    let consecutiveFailures = 0;
    let timeoutId: number | undefined;

    const checkHealth = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(healthUrl(), {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        if (active) {
          if (response.ok) {
            consecutiveFailures = 0;
            setStatus("online");
          } else {
            consecutiveFailures += 1;
            setStatus(consecutiveFailures >= 2 ? "offline" : "checking");
          }
        }
      } catch {
        if (active) {
          consecutiveFailures += 1;
          setStatus(consecutiveFailures >= 2 ? "offline" : "checking");
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) {
          const nextDelay = consecutiveFailures > 0 ? 10000 : 60000;
          timeoutId = window.setTimeout(() => void checkHealth(), nextDelay);
        }
      }
    };

    void checkHealth();

    return () => {
      active = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  if (status !== "offline") {
    return null;
  }

  return (
    <div className="api-status-banner" role="status" aria-live="polite">
      Servidor indisponível. Verifique se o sistema está ativo e tente novamente.
    </div>
  );
}
