import { describe, expect, it, vi } from "vitest";

const betterAuth = vi.hoisted(() => vi.fn((options: unknown) => ({ options })));
const prisma = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
const config = vi.hoisted(() => ({
  betterAuthSecret: "test-secret",
  betterAuthUrl: "https://english-loop.test",
  authSessionExpiresInSeconds: 3600,
  authSessionUpdateAgeSeconds: 600,
  authCookieCacheMaxAgeSeconds: 300,
  nodeEnv: "test",
}));

vi.mock("better-auth", () => ({ betterAuth }));
vi.mock("@/server/infrastructure/database/prisma-client", () => ({ prisma }));
vi.mock("@/server/infrastructure/config/config", () => ({ config }));

import { auth } from "./auth";

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
});
