// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/server/infrastructure/auth/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ cookie: "session=test" })) }));

import { BetterAuthIdentityAdapter } from "./better-auth-identity-adapter";

describe("BetterAuthIdentityAdapter", () => {
  beforeEach(() => getSession.mockReset());

  it("translates an external session into the core actor", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", name: "User", email: "u@example.com" } });
    await expect(new BetterAuthIdentityAdapter().getActor()).resolves.toEqual({ userId: "u1", name: "User", email: "u@example.com", activeLevels: ["B1"] });
    expect(getSession).toHaveBeenCalledOnce();
  });

  it("returns null and then throws the core unauthorized exception when absent", async () => {
    getSession.mockResolvedValue(null);
    const adapter = new BetterAuthIdentityAdapter();
    await expect(adapter.getActor()).resolves.toBeNull();
    await expect(adapter.requireActor()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
