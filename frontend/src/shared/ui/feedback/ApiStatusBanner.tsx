import { useEffect } from "react";
import { API_BASE_URL } from "@shared/api/http";

function healthUrl() {
  return `${API_BASE_URL.replace(/\/$/, "")}/actuator/health`;
}

export function ApiStatusBanner() {
  useEffect(() => {
    let active = true;
    let consecutiveFailures = 0;
    let timeoutId: number | undefined;

    const reportOffline = (detail: string) => {
      console.warn(`[Library] API indisponível: ${detail}. Healthcheck: ${healthUrl()}`);
    };

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
          } else {
            consecutiveFailures += 1;
            if (consecutiveFailures >= 2) {
              reportOffline(`resposta HTTP ${response.status}`);
            }
          }
        }
      } catch {
        if (active) {
          consecutiveFailures += 1;
          if (consecutiveFailures >= 2) {
            reportOffline("sem resposta do backend");
          }
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

  return null;
}
