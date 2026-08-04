import { describe, expect, it } from "vitest";
import type { D1DatabaseLike, D1PreparedStatement } from "./d1/types/binding";
import { createPersistenceBundle } from "./persistence-bundle";

function d1Database(): D1DatabaseLike {
  return {
    prepare() {
      const statement: D1PreparedStatement = {
        bind: () => statement,
        first: async () => null,
        all: async <T>() => ({ success: true, results: [{ ok: 1 } as T] }),
        run: async <T>() => ({ success: true, results: [] as T[], meta: { changes: 1 } }),
      };
      return statement;
    },
    batch: async () => [],
  };
}

describe("PersistenceBundle", () => {
  it("selects native D1 repositories when the configured provider is D1", async () => {
    const bundle = createPersistenceBundle({
      prisma: {} as never,
      config: {
        databaseProvider: "d1",
        d1Transport: "binding",
        d1HttpUrl: null,
        d1HttpToken: null,
        attemptRateLimitWindowMs: 60_000,
        attemptRateLimitMax: 30,
        authRateLimitWindowMs: 60_000,
        authRateLimitMax: 10,
      },
      binding: { DB: d1Database() },
    });

    expect(bundle.userSettingsRepository.constructor.name).toBe("D1UserSettingsRepository");
    expect(bundle.activityCatalog.constructor.name).toBe("D1CatalogAdapter");
    expect(bundle.catalogWritePort?.constructor.name).toBe("D1CatalogWriteAdapter");
    expect(bundle.attemptRateLimiter).toBeTruthy();
    await expect(bundle.databaseHealth()).resolves.toBe(true);
  });

  it("keeps Prisma composition for non-D1 providers", async () => {
    const prisma = { $queryRaw: async () => [{ ok: 1 }] } as never;
    const bundle = createPersistenceBundle({
      prisma,
      config: {
        databaseProvider: "sqlite", d1Transport: "http", d1HttpUrl: null, d1HttpToken: null,
        attemptRateLimitWindowMs: 60_000, attemptRateLimitMax: 30, authRateLimitWindowMs: 60_000, authRateLimitMax: 10,
      },
    });
    expect(bundle.catalogWritePort).toBeNull();
    await expect(bundle.databaseHealth()).resolves.toBe(true);
  });

  it("selects the HTTP catalog writer and rejects D1 without a transport", () => {
    const httpBundle = createPersistenceBundle({
      prisma: {} as never,
      config: {
        databaseProvider: "d1", d1Transport: "http", d1HttpUrl: "https://proxy.example.test", d1HttpToken: "secret",
        attemptRateLimitWindowMs: 60_000, attemptRateLimitMax: 30, authRateLimitWindowMs: 60_000, authRateLimitMax: 10,
      },
      fetch: async () => new Response(JSON.stringify({ success: true, results: [] })),
    });
    expect(httpBundle.catalogWritePort?.constructor.name).toBe("D1HttpCatalogWriteAdapter");
    expect(() => createPersistenceBundle({
      prisma: {} as never,
      config: {
        databaseProvider: "d1", d1Transport: "binding", d1HttpUrl: null, d1HttpToken: null,
        attemptRateLimitWindowMs: 60_000, attemptRateLimitMax: 30, authRateLimitWindowMs: 60_000, authRateLimitMax: 10,
      },
    })).toThrow("D1_TRANSPORT=binding requires the Cloudflare D1 binding named DB");
  });
});
