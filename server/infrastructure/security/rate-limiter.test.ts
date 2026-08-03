import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "./rate-limiter";

const clock = { now: () => new Date(1_000), nowIso: () => new Date(1_000).toISOString() };

describe("InMemoryRateLimiter", () => {
  it("allows the configured number of requests and blocks the next one", () => {
    const limiter = new InMemoryRateLimiter(1_000, 2, clock);

    expect(limiter.isLimited("user-1", 1_000)).toBe(false);
    expect(limiter.isLimited("user-1", 1_100)).toBe(false);
    expect(limiter.isLimited("user-1", 1_200)).toBe(true);
    expect(limiter.isLimited("user-2", 1_200)).toBe(false);
  });

  it("starts a fresh bucket at the window boundary", () => {
    const limiter = new InMemoryRateLimiter(1_000, 1, clock);

    expect(limiter.isLimited("user-1", 1_000)).toBe(false);
    expect(limiter.isLimited("user-1", 1_999)).toBe(true);
    expect(limiter.isLimited("user-1", 2_000)).toBe(false);
  });

  it("prunes expired buckets without affecting active ones", () => {
    const limiter = new InMemoryRateLimiter(1_000, 1, clock);

    limiter.isLimited("expired", 1_000);
    limiter.isLimited("active", 2_000);
    limiter.prune(2_000);

    expect(limiter.isLimited("expired", 2_000)).toBe(false);
    expect(limiter.isLimited("active", 2_100)).toBe(true);
  });
});
