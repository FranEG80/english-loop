/** Rate limiter independiente del mecanismo de almacenamiento. */
export interface RateLimiterPort {
  isLimited(key: string, now?: number): boolean | Promise<boolean>;
  prune?(now?: number): void | Promise<void>;
}
