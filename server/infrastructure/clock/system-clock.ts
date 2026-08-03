import "server-only";
import type { ClockPort } from "@/core/shared/kernel";

/** Reloj real basado en el sistema. */
export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }

  nowIso(): string {
    return new Date().toISOString();
  }
}
