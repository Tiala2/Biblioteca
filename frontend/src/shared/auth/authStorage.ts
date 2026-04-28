export const AUTH_STORAGE_KEY = "library.auth";
export const AUTH_EXPIRED_EVENT = "library-auth-expired";

export type StoredAuth = {
  token: string;
  email: string;
  name: string;
  roles: string[];
};

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
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

export function decodeRoles(token: string): string[] {
  const payload = decodeJwtPayload(token);
  if (!payload) return [];
  return Array.isArray(payload.roles) ? payload.roles.filter((role): role is string => typeof role === "string") : [];
}

export function getTokenExpirationMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expirationMs = getTokenExpirationMs(token);
  return expirationMs !== null && expirationMs <= now;
}

export function clearStoredAuth(options: { notify?: boolean } = {}) {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  if (options.notify) {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (typeof parsed.token !== "string" || parsed.token.length === 0) {
      clearStoredAuth();
      return null;
    }

    if (isTokenExpired(parsed.token)) {
      clearStoredAuth({ notify: true });
      return null;
    }

    return {
      token: parsed.token,
      email: typeof parsed.email === "string" ? parsed.email : "",
      name: typeof parsed.name === "string" ? parsed.name : "",
      roles: Array.isArray(parsed.roles) ? parsed.roles.filter((role): role is string => typeof role === "string") : [],
    };
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function readStoredToken(): string | null {
  return readStoredAuth()?.token ?? null;
}

export function writeStoredAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}
