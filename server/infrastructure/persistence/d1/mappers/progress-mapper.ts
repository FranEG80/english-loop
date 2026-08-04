import { ReviewItem } from "@/core/progress/domain/review-item";
import { iso, nullableText, text, type Row } from "./d1-row-mapper";

export function reviewFromRow(row: Row): ReviewItem {
  return ReviewItem.create({
    id: text(row.id), userId: text(row.userId), activityId: text(row.activityId), activityVersionId: nullableText(row.activityVersionId),
    lessonId: nullableText(row.lessonId), taxonomyNodeId: text(row.taxonomyNodeId), level: text(row.level) as never,
    stage: Number(row.stage) as never, consecutiveCorrect: Number(row.consecutiveCorrect), dueAt: iso(row.dueAt), failedAt: iso(row.failedAt),
    resolvedAt: row.resolvedAt ? iso(row.resolvedAt) : null, attemptsCount: Number(row.attemptsCount),
  });
}
