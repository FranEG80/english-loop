import { describe, expect, it } from "vitest";
import { D1RateLimiter } from "./d1-rate-limiter";

describe("D1RateLimiter", () => {
  it("maps D1 changes to allowed and limited decisions", async () => {
    const calls: unknown[] = [];
    const transport = {
      execute: async (request: unknown) => {
        calls.push(request);
        return calls.length === 1
          ? { success: true, results: [], meta: { changes: 1 } }
          : { success: true, results: [], meta: { changes: 0 } };
      },
      batch: async () => [],
    };
    const limiter = new D1RateLimiter(transport, 60_000, 2);
    await expect(limiter.isLimited("key", 1_700_000_000_000)).resolves.toBe(false);
    await expect(limiter.isLimited("key", 1_700_000_000_000)).resolves.toBe(true);
    await expect(limiter.prune()).resolves.toBeUndefined();
    expect(calls).toHaveLength(2);
  });

  it("fails closed when D1 reports an unsuccessful write", async () => {
    const limiter = new D1RateLimiter({ execute: async () => ({ success: false, results: [] }), batch: async () => [] }, 60_000, 2);
    await expect(limiter.isLimited("key", 1_700_000_000_000)).resolves.toBe(true);
  });
});
