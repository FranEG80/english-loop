import { describe, expect, it, vi } from "vitest";

const authPort = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  logout: vi.fn(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("@/adapters/adapter-factory", () => ({ getAuthPort: () => authPort }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));

import {
  changePasswordAction,
  loginDemoAction,
  loginAction,
  logoutAction,
  registerAction,
  updateProfileAction,
} from "./actions";

describe("auth server actions", () => {
  it("opens the seeded demo account and redirects to the workspace", async () => {
    await expect(loginDemoAction()).rejects.toMatchObject({ message: "REDIRECT:/" });
    expect(authPort.login).toHaveBeenCalledWith({
      email: "demo@englishloop.local",
      password: "EnglishLoop-demo-2026!",
    });
  });

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

  it("validates and updates the display name, then revalidates the layout", async () => {
    const invalid = new FormData();
    invalid.set("name", "A");
    await expect(updateProfileAction(undefined, invalid)).resolves.toEqual({
      error: "El nombre debe tener al menos 2 caracteres.",
    });
    expect(authPort.updateProfile).not.toHaveBeenCalled();

    const form = new FormData();
    form.set("name", "  Alex Updated  ");
    await expect(updateProfileAction(undefined, form)).resolves.toEqual({ success: "Perfil actualizado." });
    expect(authPort.updateProfile).toHaveBeenCalledWith({ name: "Alex Updated" });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("validates confirmation and changes the password while revoking other sessions", async () => {
    const missing = new FormData();
    await expect(changePasswordAction(undefined, missing)).resolves.toEqual({
      error: "Indica la contraseña actual y la nueva contraseña.",
    });

    const mismatch = new FormData();
    mismatch.set("currentPassword", "old-password");
    mismatch.set("newPassword", "new-password");
    mismatch.set("confirmation", "different-password");
    await expect(changePasswordAction(undefined, mismatch)).resolves.toEqual({
      error: "La confirmación no coincide con la nueva contraseña.",
    });

    const form = new FormData();
    form.set("currentPassword", "old-password");
    form.set("newPassword", "new-password");
    form.set("confirmation", "new-password");
    await expect(changePasswordAction(undefined, form)).resolves.toEqual({ success: "Contraseña actualizada." });
    expect(authPort.changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password",
      newPassword: "new-password",
      revokeOtherSessions: true,
    });
  });

  it("returns safe fallback errors for account mutations", async () => {
    authPort.updateProfile.mockRejectedValueOnce("profile failure");
    const profile = new FormData();
    profile.set("name", "Alex");
    await expect(updateProfileAction(undefined, profile)).resolves.toEqual({
      error: "No se pudo actualizar el perfil.",
    });

    authPort.changePassword.mockRejectedValueOnce("password failure");
    const password = new FormData();
    password.set("currentPassword", "old-password");
    password.set("newPassword", "new-password");
    password.set("confirmation", "new-password");
    await expect(changePasswordAction(undefined, password)).resolves.toEqual({
      error: "No se pudo actualizar la contraseña.",
    });
  });
});
