import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { bool, iso, nullableText, text, type Row } from "./d1-row-mapper";

export interface ScopeSnapshot {
  level: string;
  taxonomyNodeId: string;
  taxonomyPath: string[];
  descendantIds: string[];
  requestedCount: number;
}

export function practiceRunRowsToDomain(input: Row[]): PracticeRun | null {
  const base = input[0];
  if (!base) return null;
  const scope = JSON.parse(text(base.scopeSnapshot)) as ScopeSnapshot;
  const items = input.filter((row) => row.position !== null && row.position !== undefined);
  return PracticeRun.create({
    id: text(base.id), userId: text(base.userId), mode: text(base.mode) as never,
    scope: { level: scope.level as never, taxonomyNodeId: scope.taxonomyNodeId, taxonomyPath: scope.taxonomyPath, descendantIds: scope.descendantIds, requestedCount: scope.requestedCount },
    activityIds: items.map((row) => text(row.activityId)),
    activityVersionIds: items.map((row) => nullableText(row.activityVersionId)),
    repetitionActivityIds: items.filter((row) => bool(row.isRepetition)).map((row) => text(row.activityId)),
    originalActivityCount: Number(base.originalActivityCount), currentIndex: Number(base.currentIndex),
    status: text(base.status) as never, datasetVersion: text(base.datasetVersion), dailySessionId: null, createdAt: iso(base.createdAt),
  });
}

export function attemptFromRow(row: Row): ActivityAttempt {
  return ActivityAttempt.create({
    id: text(row.id), userId: text(row.userId), practiceRunId: nullableText(row.practiceRunId), activityId: text(row.activityId),
    activityVersionId: nullableText(row.activityVersionId), practiceRunItemId: nullableText(row.practiceRunItemId), origin: text(row.origin) as never,
    idempotencyKey: text(row.idempotencyKey), response: JSON.parse(text(row.response)) as never, isCorrect: bool(row.isCorrect),
    isRepetition: bool(row.isRepetition), evaluatorVersion: text(row.evaluatorVersion), submittedAt: iso(row.submittedAt),
  });
}
