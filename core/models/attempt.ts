export type ActivityResponseValue =
  | { kind: "boolean"; value: boolean }
  | { kind: "boolean_list"; value: boolean[] }
  | { kind: "single"; value: string }
  | { kind: "multiple"; value: string[] }
  | { kind: "text"; value: string }
  | { kind: "ordered_list"; value: string[] }
  | { kind: "pairs"; value: Array<{ leftId: string; rightId: string }> };

export interface SubmitAttemptInputDto {
  activityId: string;
  response: ActivityResponseValue;
}

export interface AttemptFeedbackDto {
  attemptId: string;
  activityId: string;
  isCorrect: boolean;
  correctAnswer: string | string[];
  /** Explicación en español. */
  explanation: string;
  submittedAt: string;
}
