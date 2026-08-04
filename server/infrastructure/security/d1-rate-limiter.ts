import "server-only";
import type { RateLimiterPort } from "@/core/shared/kernel";
import type { D1TransportClient } from "../persistence/d1/types/transport";
import { operation } from "../persistence/d1/operations/request";

/** Distributed rate limiter backed by the native D1 operation allow-list. */
export class D1RateLimiter implements RateLimiterPort {
  constructor(
    private readonly transport: D1TransportClient,
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  async isLimited(key: string, now = Date.now()): Promise<boolean> {
    const result = await this.transport.execute(operation({
      name: "rateLimitConsume",
      snapshot: {
        key,
        nowIso: new Date(now).toISOString(),
        resetAtIso: new Date(now + this.windowMs).toISOString(),
        max: this.maxRequests,
      },
    }));
    return !result.success || (result.meta?.changes ?? 0) === 0;
  }

  async prune(): Promise<void> {
    // D1 buckets are replaced lazily by the guarded upsert. A separate
    // DELETE operation would widen the public transport surface for no gain.
  }
}
