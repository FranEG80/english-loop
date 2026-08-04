import { DailySession } from "@/core/learning/domain/daily-session";
import { nullableText, text, iso, type Row } from "./d1-row-mapper";

export function sessionRowsToDomain(input: Row[]): DailySession | null {
  const base = input[0];
  if (!base) return null;
  return DailySession.create({
    id: text(base.id), userId: text(base.userId), date: text(base.date), status: text(base.status) as never,
    datasetVersion: text(base.datasetVersion), seed: text(base.seed), practiceRunId: nullableText(base.practiceRunId),
    createdAt: iso(base.createdAt),
    lessons: input.filter((row) => row.lessonId !== null && row.lessonId !== undefined).map((row) => ({
      lessonId: text(row.lessonId), order: Number(row.lessonOrder), status: text(row.lessonStatus) as never,
      selectionReason: text(row.selectionReason), completedAt: row.completedAt ? iso(row.completedAt) : null,
    })),
  });
}
