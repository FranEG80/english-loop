import { beforeEach, describe, expect, it, vi } from "vitest";

const cookie = vi.hoisted(() => ({ value: null as string | null, get: vi.fn(), set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => cookie }));

import { authMockAdapter } from "./auth-mock-adapter";

describe("authMockAdapter", () => {
  beforeEach(() => {
    cookie.value = null;
    cookie.get.mockImplementation(() => cookie.value ? { value: cookie.value } : undefined);
    cookie.set.mockImplementation((_name: string, value: string) => { cookie.value = value; });
    cookie.delete.mockImplementation(() => { cookie.value = null; });
  });

  it("logs in valid credentials, reads the session and logs out", async () => {
    await expect(authMockAdapter.getSession()).resolves.toBeNull();
    const session = await authMockAdapter.login({ email: "alex@example.com", password: "password123" });
    expect(session.userId).toBeTruthy();
    await expect(authMockAdapter.getSession()).resolves.toEqual(session);
    await authMockAdapter.logout();
    await expect(authMockAdapter.getSession()).resolves.toBeNull();
  });

  it("rejects invalid credentials and registers the supplied profile", async () => {
    await expect(
      authMockAdapter.login({ email: "bad@example.com", password: "bad" }),
    ).rejects.toMatchObject({ message: expect.stringMatching(/incorrectos/iu) });
    const session = await authMockAdapter.register({ name: "New", email: "new@example.com", password: "password" });
    expect(session).toMatchObject({ name: "New", email: "new@example.com" });
  });
});
