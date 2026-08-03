import type { ReviewItem, ReviewStage } from "./review-item";

const REVIEW_INITIAL_STAGE: ReviewStage = 0;
const REVIEW_FIRST_SUCCESS_STAGE: ReviewStage = 1;
const REVIEW_SECOND_SUCCESS_STAGE: ReviewStage = 2;
const REVIEW_RESOLVED_STAGE: ReviewStage = 3;
const REVIEW_FAILURE_DELAY_DAYS = 1;
const REVIEW_FIRST_SUCCESS_DELAY_DAYS = 3;
const REVIEW_SECOND_SUCCESS_DELAY_DAYS = 7;

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
      if (consecutiveCorrect >= REVIEW_RESOLVED_STAGE) {
        return {
          stage: REVIEW_RESOLVED_STAGE,
          consecutiveCorrect,
          dueAt: this.now.toISOString(),
          resolved: true,
        };
      }
      const days = consecutiveCorrect === REVIEW_FIRST_SUCCESS_STAGE
        ? REVIEW_FIRST_SUCCESS_DELAY_DAYS
        : REVIEW_SECOND_SUCCESS_DELAY_DAYS;
      return {
        stage: consecutiveCorrect === REVIEW_FIRST_SUCCESS_STAGE
          ? REVIEW_FIRST_SUCCESS_STAGE
          : REVIEW_SECOND_SUCCESS_STAGE,
        consecutiveCorrect,
        dueAt: this.addDays(this.now, days).toISOString(),
        resolved: false,
      };
    }

    // Fallo: reinicia la etapa.
    return {
      stage: REVIEW_INITIAL_STAGE,
      consecutiveCorrect: 0,
      dueAt: this.addDays(this.now, REVIEW_FAILURE_DELAY_DAYS).toISOString(),
      resolved: false,
    };
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
}
