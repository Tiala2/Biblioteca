import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { api } from "./http";
import { AUTH_EXPIRED_EVENT, AUTH_STORAGE_KEY, writeStoredAuth } from "@shared/auth/authStorage";

function createToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${body}.signature`;
}

function unauthorizedAdapter(): AxiosAdapter {
  return async (config) => {
    const requestConfig = config as InternalAxiosRequestConfig;
    throw new AxiosError(
      "Unauthorized",
      "ERR_BAD_REQUEST",
      requestConfig,
      {},
      {
        config: requestConfig,
        data: { code: "AUTHENTICATION_FAILED" },
        headers: {},
        status: 401,
        statusText: "Unauthorized",
      }
    );
  };
}

describe("api http interceptors", () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/login");
    api.defaults.adapter = unauthorizedAdapter();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it("nao dispara sessao expirada quando login sem sessao recebe 401", async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    await expect(api.post("/api/v1/auth/login", {})).rejects.toBeInstanceOf(AxiosError);

    expect(listener).not.toHaveBeenCalled();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it("limpa sessao e avisa expiracao quando request autenticado recebe 401", async () => {
    const token = createToken({ roles: ["ROLE_USER"], exp: Math.floor(Date.now() / 1000) + 60 });
    const listener = vi.fn();
    writeStoredAuth({ token, email: "user@email.com", name: "User", roles: ["ROLE_USER"] });
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    await expect(api.get("/api/v1/users/me")).rejects.toBeInstanceOf(AxiosError);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
