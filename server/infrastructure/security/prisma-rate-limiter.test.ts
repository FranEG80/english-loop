// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma-transaction-context", () => ({
  getPrismaClient: (client: unknown) => client,
}));

import { PrismaRateLimiter } from "./prisma-rate-limiter";

describe("PrismaRateLimiter", () => {
  it("counts requests, resets expired windows and prunes old buckets", async () => {
    const buckets = new Map<string, { key: string; count: number; resetAt: Date }>();
    const client = {
      rateLimitBucket: {
        findUnique: async ({ where: { key } }: { where: { key: string } }) => buckets.get(key) ?? null,
        upsert: async ({ where: { key }, create, update }: { where: { key: string }; create: { key: string; count: number; resetAt: Date }; update: { count: number; resetAt: Date } }) => {
          const value = buckets.get(key) ?? { key, count: 0, resetAt: new Date(0) };
          const next = buckets.has(key) ? { ...value, ...update } : create;
          buckets.set(key, next);
          return next;
        },
        update: async ({ where: { key }, data }: { where: { key: string }; data: { count: { increment: number } } }) => {
          const current = buckets.get(key);
          if (!current) throw new Error("missing bucket");
          const next = { ...current, count: current.count + data.count.increment };
          buckets.set(key, next);
          return next;
        },
        deleteMany: async ({ where: { resetAt: { lte } } }: { where: { resetAt: { lte: Date } } }) => {
          for (const [key, bucket] of buckets) if (bucket.resetAt <= lte) buckets.delete(key);
          return { count: 1 };
        },
      },
    };
    const limiter = new PrismaRateLimiter(client as never, 1_000, 2, { now: () => new Date(1_000), nowIso: () => "now" });
    expect(await limiter.isLimited("user", 1_000)).toBe(false);
    expect(await limiter.isLimited("user", 1_100)).toBe(false);
    expect(await limiter.isLimited("user", 1_200)).toBe(true);
    expect(await limiter.isLimited("user", 2_000)).toBe(false);
    await limiter.prune(3_000);
    expect(buckets.has("user")).toBe(false);
  });
});
