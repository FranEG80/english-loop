import "server-only";
import type { ClockPort, RateLimiterPort } from "@/core/shared/kernel";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter simple en memoria (por proceso). Adecuado para desarrollo y
 * despliegues de un solo nodo. Para producción multi-nodo habría que usar un
 * store distribuido (Redis).
 */
export class InMemoryRateLimiter implements RateLimiterPort {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly clock: ClockPort,
  ) {}

  /** Devuelve true si la clave superó el límite. */
  isLimited(key: string, now = this.clock.now().getTime()): boolean {
    const bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }
    bucket.count += 1;
    if (bucket.count > this.maxRequests) {
      return true;
    }
    return false;
  }

  /** Limpia las claves expiradas para evitar fugas de memoria. */
  prune(now = this.clock.now().getTime()): void {
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
  }
}
