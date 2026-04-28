import {
  AUTH_EXPIRED_EVENT,
  AUTH_STORAGE_KEY,
  decodeRoles,
  isTokenExpired,
  readStoredAuth,
  writeStoredAuth,
} from "./authStorage";

function createToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${header}.${body}.signature`;
}

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("decodifica roles do JWT armazenando apenas dados minimos da sessao", () => {
    const token = createToken({ roles: ["ROLE_USER", "ROLE_ADMIN"], exp: Math.floor(Date.now() / 1000) + 60 });

    writeStoredAuth({
      token,
      email: "admin@email.com",
      name: "Admin",
      roles: decodeRoles(token),
    });

    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? "{}")).toEqual({
      token,
      email: "admin@email.com",
      name: "Admin",
      roles: ["ROLE_USER", "ROLE_ADMIN"],
    });
    expect(readStoredAuth()?.roles).toEqual(["ROLE_USER", "ROLE_ADMIN"]);
  });

  it("remove sessao expirada e avisa a aplicacao", () => {
    const expiredToken = createToken({ roles: ["ROLE_USER"], exp: Math.floor(Date.now() / 1000) - 10 });
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: expiredToken,
        email: "user@email.com",
        name: "User",
        roles: ["ROLE_USER"],
      })
    );

    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(readStoredAuth()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
