import type { ActivityProgressRecord, ProgressRepository, TaxonomyProgressRecord } from "@/core/progress/ports/progress-repository";
import type { ReviewRepository } from "@/core/progress/ports/review-repository";
import type { D1TransportClient } from "./types/transport";
import { ReviewItem } from "@/core/progress/domain/review-item";
import type { D1ActivityProgressSnapshot, D1ReviewSnapshot, D1TaxonomyProgressSnapshot } from "./types/operations";
import { bool, first, iso, rows, text, type Row } from "./mappers/d1-row-mapper";
import { reviewFromRow } from "./mappers/progress-mapper";
import { operation } from "./operations/request";

export class D1ProgressRepository implements ProgressRepository {
  constructor(private readonly transport: D1TransportClient) {}

  async getActivityProgress(userId: string, activityId: string): Promise<ActivityProgressRecord | null> {
    const row = first<Row>(await this.transport.execute(operation({ name: "activityProgressGet", userId, activityId })));
    return row ? { userId: text(row.userId), activityId: text(row.activityId), attemptsCount: Number(row.attemptsCount), correctCount: Number(row.correctCount), lastResult: row.lastResult === null ? null : bool(row.lastResult), lastAttemptAt: row.lastAttemptAt ? iso(row.lastAttemptAt) : null } : null;
  }

  async upsertActivityProgress(record: ActivityProgressRecord): Promise<void> {
    const snapshot: D1ActivityProgressSnapshot = { ...record };
    await this.transport.execute(operation({ name: "activityProgressSave", snapshot }));
  }

  async getTaxonomyProgress(userId: string, taxonomyNodeId: string): Promise<TaxonomyProgressRecord | null> {
    const row = first<Row>(await this.transport.execute(operation({ name: "taxonomyProgressGet", userId, taxonomyNodeId })));
    return row ? { userId: text(row.userId), taxonomyNodeId: text(row.taxonomyNodeId), attemptsCount: Number(row.attemptsCount), correctCount: Number(row.correctCount) } : null;
  }

  async upsertTaxonomyProgress(record: TaxonomyProgressRecord): Promise<void> {
    const snapshot: D1TaxonomyProgressSnapshot = { ...record };
    await this.transport.execute(operation({ name: "taxonomyProgressSave", snapshot }));
  }

  async getOverview(userId: string): Promise<{ totalActivitiesCompleted: number; totalCorrect: number; totalAttempts: number; strongTopicIds: string[]; weakTopicIds: string[] }> {
    const result = rows(await this.transport.execute(operation({ name: "progressOverview", userId })));
    const activities = result.filter((row) => row.kind === "activity");
    const taxonomy = result.filter((row) => row.kind === "taxonomy");
    const strongTopicIds: string[] = [];
    const weakTopicIds: string[] = [];
    for (const row of taxonomy) {
      const attempts = Number(row.attemptsCount);
      if (attempts === 0) continue;
      const accuracy = Number(row.correctCount) / attempts;
      if (accuracy >= 0.8) strongTopicIds.push(text(row.itemId));
      else if (accuracy < 0.5) weakTopicIds.push(text(row.itemId));
    }
    return {
      totalActivitiesCompleted: activities.length,
      totalCorrect: activities.reduce((sum, row) => sum + Number(row.correctCount), 0),
      totalAttempts: activities.reduce((sum, row) => sum + Number(row.attemptsCount), 0),
      strongTopicIds, weakTopicIds,
    };
  }
}

export class D1ReviewRepository implements ReviewRepository {
  constructor(private readonly transport: D1TransportClient) {}

  async findByUserIdAndActivity(userId: string, activityId: string): Promise<ReviewItem | null> {
    const row = first<Row>(await this.transport.execute(operation({ name: "reviewGetByActivity", userId, activityId })));
    return row ? reviewFromRow(row) : null;
  }

  async findDueByUserId(userId: string, nowIso: string): Promise<ReviewItem[]> {
    return rows(await this.transport.execute(operation({ name: "reviewGetDue", userId, nowIso }))).map(reviewFromRow);
  }

  async findUpcomingByUserId(userId: string, nowIso: string): Promise<ReviewItem[]> {
    return rows(await this.transport.execute(operation({ name: "reviewGetUpcoming", userId, nowIso, limit: 20 }))).map(reviewFromRow);
  }

  async save(item: ReviewItem): Promise<void> {
    const snapshot = item.toSnapshot();
    const request: D1ReviewSnapshot = {
      ...snapshot,
      activityVersionId: snapshot.activityVersionId ?? null,
      lessonId: snapshot.lessonId ?? null,
    };
    await this.transport.execute(operation({ name: "reviewSave", snapshot: request }));
  }
}
