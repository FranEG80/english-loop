import { describe, expect, it, vi } from "vitest";

const betterAuth = vi.hoisted(() => vi.fn((options: unknown) => ({ options })));
const prisma = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
const config = vi.hoisted(() => ({
  betterAuthSecret: "test-secret",
  betterAuthUrl: "https://english-loop.test",
  authSessionExpiresInSeconds: 3600,
  authSessionUpdateAgeSeconds: 600,
  authCookieCacheMaxAgeSeconds: 300,
  databaseProvider: "sqlite",
  d1Transport: "binding",
  d1HttpUrl: null,
  d1HttpToken: null,
  nodeEnv: "test",
}));
const createD1Transport = vi.hoisted(() => vi.fn(() => ({ execute: vi.fn() })));
const createD1BetterAuthAdapter = vi.hoisted(() => vi.fn(() => ({ execute: vi.fn() })));

vi.mock("better-auth", () => ({ betterAuth }));
vi.mock("@/server/infrastructure/database/prisma-client", () => ({ prisma }));
vi.mock("@/server/infrastructure/config/config", () => ({ config }));
vi.mock("../persistence/d1/d1-runtime", () => ({ createD1Transport }));
vi.mock("./d1-better-auth-adapter", () => ({ createD1BetterAuthAdapter }));

import { auth, createAuth } from "./auth";

describe("Better Auth configuration boundary", () => {
  it("passes persistence, security and session policy to Better Auth", () => {
    expect(betterAuth).toHaveBeenCalledOnce();
    expect(auth).toEqual({ options: expect.any(Object) });
    const options = betterAuth.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(options).toMatchObject({
      database: prisma,
      secret: "test-secret",
      baseURL: "https://english-loop.test",
      emailAndPassword: { enabled: true },
      session: {
        expiresIn: 3600,
        updateAge: 600,
        cookieCache: { enabled: true, maxAge: 300 },
      },
      advanced: {
        cookiePrefix: "englishloop",
        defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: false },
      },
    });
  });

  it("builds Better Auth with native D1 and rejects a missing transport", () => {
    config.databaseProvider = "d1";
    config.d1Transport = "binding";
    const binding = { DB: {} };
    const database = createAuth({ binding: binding as never });
    expect(database).toEqual({ options: expect.any(Object) });
    expect(createD1Transport).toHaveBeenCalledWith(expect.objectContaining({ databaseProvider: "d1", d1Transport: "binding", binding }));
    expect(createD1BetterAuthAdapter).toHaveBeenCalled();

    createD1Transport.mockReturnValueOnce(null);
    expect(() => createAuth({ binding: binding as never })).toThrow("D1 auth requires a configured D1 transport");
  });

  it("keeps the exported binding auth lazy until a Worker binding is supplied", async () => {
    vi.resetModules();
    config.databaseProvider = "d1";
    config.d1Transport = "binding";
    const bindingModule = await import("./auth?binding");
    expect(() => (bindingModule.auth as Record<string, unknown>).request).toThrow("D1 binding auth must be created with createAuth");
  });
});
