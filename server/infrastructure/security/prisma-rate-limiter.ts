import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { ClockPort, RateLimiterPort } from "@/core/shared/kernel";
import { getPrismaClient } from "../database/prisma-transaction-context";

/** Store distribuido en la propia BD para despliegues multi-nodo. */
export class PrismaRateLimiter implements RateLimiterPort {
  constructor(
    private readonly client: PrismaClient,
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly clock: ClockPort,
  ) {}

  async isLimited(key: string, now = this.clock.now().getTime()): Promise<boolean> {
    const db = getPrismaClient(this.client);
    const current = await db.rateLimitBucket.findUnique({ where: { key } });
    if (!current || now >= current.resetAt.getTime()) {
      await db.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now + this.windowMs) },
        update: { count: 1, resetAt: new Date(now + this.windowMs) },
      });
      return false;
    }
    const next = await db.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return next.count > this.maxRequests;
  }

  async prune(now = this.clock.now().getTime()): Promise<void> {
    await getPrismaClient(this.client).rateLimitBucket.deleteMany({
      where: { resetAt: { lte: new Date(now) } },
    });
  }
}
