import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  updateUser: vi.fn(),
  changePassword: vi.fn(),
  signOut: vi.fn(),
}));
const requestHeaders = vi.hoisted(() => vi.fn(async () => new Headers({ cookie: "session=test" })));

vi.mock("@/server/infrastructure/auth/next-auth", () => ({ nextAuth: { api } }));
vi.mock("next/headers", () => ({ headers: requestHeaders }));

import { authServerAdapter } from "./auth-server-adapter";

const user = { id: "u1", name: "User", email: "u@example.com" };

describe("authServerAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getSession.mockResolvedValue({ user });
    api.signInEmail.mockResolvedValue({ user });
    api.signUpEmail.mockResolvedValue({ user });
    api.updateUser.mockResolvedValue({ status: true });
    api.changePassword.mockResolvedValue({ status: true });
    api.signOut.mockResolvedValue({ success: true });
  });

  it("maps the Better Auth session and delegates account operations", async () => {
    await expect(authServerAdapter.getSession()).resolves.toMatchObject({
      userId: "u1",
      activeLevels: ["B1"],
    });
    await expect(authServerAdapter.login({ email: user.email, password: "secret" })).resolves.toMatchObject({ email: user.email });
    await expect(authServerAdapter.register({ name: user.name, email: user.email, password: "secret" })).resolves.toMatchObject({ name: user.name });
    await authServerAdapter.updateProfile({ name: "Updated" });
    await authServerAdapter.changePassword({ currentPassword: "secret", newPassword: "new-secret" });
    await authServerAdapter.logout();

    expect(api.signInEmail).toHaveBeenCalledWith(expect.objectContaining({ body: { email: user.email, password: "secret" }, headers: expect.any(Headers) }));
    expect(api.signUpEmail).toHaveBeenCalledWith(expect.objectContaining({ body: { name: user.name, email: user.email, password: "secret" } }));
    expect(api.updateUser).toHaveBeenCalledWith(expect.objectContaining({ body: { name: "Updated" } }));
    expect(api.changePassword).toHaveBeenCalledWith(expect.objectContaining({ body: { currentPassword: "secret", newPassword: "new-secret", revokeOtherSessions: true } }));
    expect(api.signOut).toHaveBeenCalledWith(expect.objectContaining({ headers: expect.any(Headers) }));
    expect(requestHeaders).toHaveBeenCalled();
  });

  it("returns no session for anonymous requests and rejects responses without a user", async () => {
    api.getSession.mockResolvedValue(null);
    api.signInEmail.mockResolvedValue({});

    await expect(authServerAdapter.getSession()).resolves.toBeNull();
    await expect(authServerAdapter.login({ email: user.email, password: "secret" })).rejects.toMatchObject({
      message: "No se pudo establecer la sesión.",
    });
  });
});
