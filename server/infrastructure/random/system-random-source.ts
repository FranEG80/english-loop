import "server-only";
import type { RandomSourcePort } from "@/core/shared/kernel";

/** Fuente de aleatoriedad basada en Math.random. */
export class SystemRandomSource implements RandomSourcePort {
  int(max: number): number {
    return Math.floor(Math.random() * max);
  }

  float(): number {
    return Math.random();
  }

  shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.float() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
