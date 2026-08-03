import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => store) }));

import { clearAuthCookie, readAuthCookie, writeAuthCookie } from "./auth-cookie-server";

describe("auth cookie server adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads a session id and returns null when absent", async () => {
    store.get.mockReturnValueOnce({ value: "user-1" }).mockReturnValueOnce(undefined);
    await expect(readAuthCookie()).resolves.toBe("user-1");
    await expect(readAuthCookie()).resolves.toBeNull();
  });

  it("writes and clears the hardened session cookie", async () => {
    await writeAuthCookie("user-1");
    expect(store.set).toHaveBeenCalledWith("el_session", "user-1", expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }));
    await clearAuthCookie();
    expect(store.delete).toHaveBeenCalledWith("el_session");
  });
});
