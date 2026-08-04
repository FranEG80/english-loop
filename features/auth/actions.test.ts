import { describe, expect, it, vi } from "vitest";

const authPort = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn(), logout: vi.fn() }));
vi.mock("@/adapters/adapter-factory", () => ({ getAuthPort: () => authPort }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));

import { loginAction, logoutAction, registerAction } from "./actions";

describe("auth server actions", () => {
  it("returns adapter errors instead of throwing", async () => {
    authPort.login.mockRejectedValueOnce(new Error("invalid credentials"));
    const result = await loginAction(undefined, new FormData());
    expect(result).toEqual({ error: "invalid credentials" });
  });

  it("uses safe fallback messages and empty values for non-Error failures", async () => {
    authPort.login.mockRejectedValueOnce("invalid");
    await expect(loginAction(undefined, new FormData())).resolves.toEqual({ error: "No se pudo iniciar sesión." });
    authPort.register.mockRejectedValueOnce("invalid");
    await expect(registerAction(undefined, new FormData())).resolves.toEqual({ error: "No se pudo crear la cuenta." });
    expect(authPort.register).toHaveBeenLastCalledWith({ name: "", email: "", password: "" });
  });

  it("passes credentials and redirects after login and registration", async () => {
    const login = new FormData();
    login.set("email", "alex@example.com");
    login.set("password", "secret");
    await expect(loginAction(undefined, login)).rejects.toMatchObject({ message: "REDIRECT:/" });
    expect(authPort.login).toHaveBeenCalledWith({ email: "alex@example.com", password: "secret" });

    const register = new FormData();
    register.set("name", "Alex");
    register.set("email", "alex@example.com");
    register.set("password", "secret");
    await expect(registerAction(undefined, register)).rejects.toMatchObject({ message: "REDIRECT:/" });
    expect(authPort.register).toHaveBeenCalledWith({ name: "Alex", email: "alex@example.com", password: "secret" });
  });

  it("logs out through the adapter and redirects", async () => {
    await expect(logoutAction()).rejects.toMatchObject({ message: "REDIRECT:/" });
    expect(authPort.logout).toHaveBeenCalledOnce();
  });
});
