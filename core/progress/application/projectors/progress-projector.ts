import type { Activity } from "@/core/content/domain/activity";
import type { TaxonomyCatalogPort } from "@/core/content/ports/catalog-ports";
import { UniqueId, type ClockPort, type IdGeneratorPort } from "@/core/shared/kernel";
import type { AttemptOrigin } from "@/core/practice/domain/activity-attempt";
import type { ProgressRepository } from "../../ports/progress-repository";
import type { ReviewRepository } from "../../ports/review-repository";
import type { LessonProgressRepository } from "@/core/learning/ports/lesson-progress-repository";
import { ReviewItem } from "../../domain/review-item";
import { ReviewPolicy } from "../../domain/review-policy";

export interface ProjectAttemptInput {
  userId: string;
  activity: Activity;
  origin: AttemptOrigin;
  isCorrect: boolean;
  attemptedAt: string;
}

/** Proyección síncrona y transaccional derivada de un intento inmutable. */
export class ProgressProjector {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly taxonomyCatalog: TaxonomyCatalogPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly lessonProgressRepository?: LessonProgressRepository,
  ) {}

  async project(input: ProjectAttemptInput): Promise<boolean> {
    const { userId, activity, isCorrect, attemptedAt, origin } = input;
    const activityProgress = (await this.progressRepository.getActivityProgress(
      userId,
      activity.id,
    )) ?? {
            userId,
            activityId: activity.id,
      attemptsCount: 0,
      correctCount: 0,
      lastResult: null,
      lastAttemptAt: null,
    };
    await this.progressRepository.upsertActivityProgress({
      ...activityProgress,
      attemptsCount: activityProgress.attemptsCount + 1,
      correctCount: activityProgress.correctCount + (isCorrect ? 1 : 0),
      lastResult: isCorrect,
      lastAttemptAt: attemptedAt,
    });

    const nodeIds = new Set<string>();
    for (const nodeId of activity.taxonomyNodeIds) {
      const path = await this.taxonomyCatalog.getNodePath(nodeId);
      for (const node of path) nodeIds.add(node.id);
      if (path.length === 0) nodeIds.add(nodeId);
    }
    for (const taxonomyNodeId of nodeIds) {
      const taxonomyProgress =
        (await this.progressRepository.getTaxonomyProgress(userId, taxonomyNodeId)) ?? {
          userId,
          taxonomyNodeId,
          attemptsCount: 0,
          correctCount: 0,
        };
      await this.progressRepository.upsertTaxonomyProgress({
        ...taxonomyProgress,
        attemptsCount: taxonomyProgress.attemptsCount + 1,
        correctCount: taxonomyProgress.correctCount + (isCorrect ? 1 : 0),
      });
    }

    if (!isCorrect) {
      const existingReview = await this.reviewRepository.findByUserIdAndActivity(
        userId,
        activity.id,
      );
      const policy = new ReviewPolicy(new Date(attemptedAt));
      if (existingReview) {
        const result = policy.apply(existingReview, false);
        await this.reviewRepository.save(
          ReviewItem.create({
            ...existingReview.toSnapshot(),
            stage: result.stage,
            consecutiveCorrect: result.consecutiveCorrect,
            dueAt: result.dueAt,
            resolvedAt: null,
            attemptsCount: existingReview.attemptsCount + 1,
          }),
        );
      } else {
        const taxonomyNodeId = activity.taxonomyNodeIds[0] ?? "unclassified";
        const initial = ReviewItem.create({
          id: UniqueId.create(this.idGenerator).toString(),
          userId,
          activityId: activity.id,
          activityVersionId: activity.versionId,
          lessonId: activity.lessonIds[0] ?? null,
          taxonomyNodeId,
          level: activity.level,
          stage: 0,
          consecutiveCorrect: 0,
          dueAt: attemptedAt,
          failedAt: attemptedAt,
          resolvedAt: null,
          attemptsCount: 0,
        });
        const result = policy.apply(initial, false);
        await this.reviewRepository.save(
          ReviewItem.create({
            ...initial.toSnapshot(),
            stage: result.stage,
            consecutiveCorrect: result.consecutiveCorrect,
            dueAt: result.dueAt,
            attemptsCount: 1,
          }),
        );
        await this.changeLessonPending(activity.lessonIds, userId, 1);
      }
      return true;
    }

    if (origin === "SMART_REVIEW") {
      const existingReview = await this.reviewRepository.findByUserIdAndActivity(
        userId,
        activity.id,
      );
      if (existingReview && !existingReview.isResolved) {
        const result = new ReviewPolicy(new Date(attemptedAt)).apply(
          existingReview,
          true,
        );
        await this.reviewRepository.save(
          ReviewItem.create({
            ...existingReview.toSnapshot(),
            stage: result.stage,
            consecutiveCorrect: result.consecutiveCorrect,
            dueAt: result.dueAt,
            resolvedAt: result.resolved ? attemptedAt : null,
            attemptsCount: existingReview.attemptsCount + 1,
          }),
        );
        if (result.resolved) {
          await this.changeLessonPending(activity.lessonIds, userId, -1);
        }
        return true;
      }
    }
    return false;
  }

  private async changeLessonPending(
    lessonIds: string[],
    userId: string,
    delta: number,
  ): Promise<void> {
    if (!this.lessonProgressRepository || lessonIds.length === 0) return;
    const records = await this.lessonProgressRepository.findByUserId(userId);
    const byLesson = new Map(records.map((record) => [record.lessonId, record]));
    for (const lessonId of new Set(lessonIds)) {
      const current = byLesson.get(lessonId) ?? {
        userId,
        lessonId,
        viewed: false,
        viewedAt: null,
        errorsPending: 0,
      };
      await this.lessonProgressRepository.upsert({
        ...current,
        errorsPending: Math.max(0, current.errorsPending + delta),
      });
    }
  }

  /** Mantiene el reloj como dependencia explícita del projector. */
  nowIso(): string {
    return this.clock.nowIso();
  }
}
