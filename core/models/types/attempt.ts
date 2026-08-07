export type ActivityResponseValue =
  | { kind: "boolean"; value: boolean }
  | { kind: "single"; value: string }
  | { kind: "multiple"; value: string[] }
  | { kind: "text"; value: string }
  /** Fragmentos ordenados de `word_order`: ids de token, nunca texto. */
  | { kind: "ordered_list"; value: string[] }
  | { kind: "pairs"; value: Array<{ leftId: string; rightId: string }> }
  /** Un valor por hueco, casado por `gapId`. */
  | { kind: "gaps"; value: Array<{ gapId: string; text: string }> }
  /** Un valor por carta de `swipe_deck`. */
  | { kind: "deck"; value: Array<{ cardId: string; value: boolean }> }
  /** Una opción elegida por ronda de `mini_game`. */
  | { kind: "rounds"; value: Array<{ roundId: string; optionId: string }> };

/**
 * Resultado de un sub-ítem corregible: un hueco, una carta, una ronda, un par
 * de matching o la respuesta única de la actividad.
 */
export interface AttemptItemResultDto {
  itemId: string;
  label: string;
  given: string;
  expected: string[];
  isCorrect: boolean;
  /** Por qué falla, cuando el contenido lo aporta. */
  feedback?: string;
}

export interface SubmitAttemptInputDto {
  activityId: string;
  idempotencyKey: string;
  response: ActivityResponseValue;
}

export interface AttemptFeedbackDto {
  attemptId: string;
  activityId: string;
  isCorrect: boolean;
  /** Media de aciertos entre 0 y 1. Vale 0 o 1 en actividades de un solo ítem. */
  score: number;
  correctAnswer: string | string[];
  normalizedResponse: ActivityResponseValue;
  /** Desglose por hueco, carta o ronda. Un solo elemento si no hay sub-ítems. */
  items: AttemptItemResultDto[];
  /** Explicación en español. */
  explanation: string;
  /** Próximo vencimiento del repaso, si el intento dejó uno activo. */
  nextReviewAt: string | null;
  submittedAt: string;
}
