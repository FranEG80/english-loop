export type PedagogicalMetricName =
  | "attempt.processed"
  | "attempt.idempotency_conflict"
  | "daily_session.created"
  | "daily_session.completed"
  | "practice_run.created"
  | "scope.insufficient";

/** Puerto de telemetría de bajo cardinalidad para indicadores pedagógicos. */
export interface PedagogicalMetricsPort {
  recordPedagogicalEvent(
    name: PedagogicalMetricName,
    dimensions?: Readonly<Record<string, string>>,
  ): void;
  recordReviewQueueSize(size: number): void;
}
