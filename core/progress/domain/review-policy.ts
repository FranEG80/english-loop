import type { ReviewItem, ReviewStage } from "./review-item";

export interface ReviewPolicyResult {
  /** Nueva etapa tras el intento. */
  stage: ReviewStage;
  /** Nuevo número de aciertos consecutivos. */
  consecutiveCorrect: number;
  /** Nueva fecha de vencimiento (ISO). */
  dueAt: string;
  /** true si la entrada quedó resuelta. */
  resolved: boolean;
}

/**
 * Política de repaso:
 * - Tras un fallo: etapa 0, programar al día siguiente.
 * - 1er acierto: etapa 1, programar a 3 días.
 * - 2º acierto consecutivo: etapa 2, programar a 7 días.
 * - 3er acierto consecutivo: resolver (etapa 3).
 * - Un nuevo fallo reinicia la etapa.
 */
export class ReviewPolicy {
  constructor(private readonly now: Date) {}

  apply(item: ReviewItem, isCorrect: boolean): ReviewPolicyResult {
    if (isCorrect) {
      const consecutiveCorrect = item.consecutiveCorrect + 1;
      if (consecutiveCorrect >= 3) {
        return {
          stage: 3,
          consecutiveCorrect,
          dueAt: this.now.toISOString(),
          resolved: true,
        };
      }
      const days = consecutiveCorrect === 1 ? 3 : 7;
      return {
        stage: consecutiveCorrect as ReviewStage,
        consecutiveCorrect,
        dueAt: this.addDays(this.now, days).toISOString(),
        resolved: false,
      };
    }

    // Fallo: reinicia la etapa.
    return {
      stage: 0,
      consecutiveCorrect: 0,
      dueAt: this.addDays(this.now, 1).toISOString(),
      resolved: false,
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
