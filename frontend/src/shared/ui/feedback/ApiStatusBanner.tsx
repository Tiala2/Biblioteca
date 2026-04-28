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
          setStatus(response.ok ? "online" : "offline");
        }
      } catch {
        if (active) {
          setStatus("offline");
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (status !== "offline") {
    return null;
  }

  return (
    <div className="api-status-banner" role="status" aria-live="polite">
      API indisponivel. Verifique se o backend esta ativo e tente novamente.
    </div>
  );
}
