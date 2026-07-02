import type {
  ActivityQuestionDto,
  ReviewQueueDto,
  TaxonomyNodeDto,
} from "@/core/models";
import type {
  LearningContentPort,
  ProgressPort,
} from "@/core/ports";

export interface ReviewHub {
  queue: ReviewQueueDto;
  activitiesById: Record<string, ActivityQuestionDto>;
  taxonomy: TaxonomyNodeDto[];
}

export async function getReviewHub(
  progress: ProgressPort,
  content: LearningContentPort,
): Promise<ReviewHub> {
  const [queue, taxonomy] = await Promise.all([
    progress.getReviewQueue(),
    content.getTaxonomyTree(),
  ]);
  const ids = [...queue.dueItems, ...queue.upcomingItems].map(
    (item) => item.activityId,
  );
  const activities = await Promise.all(
    ids.map((id) => content.getActivityById(id)),
  );
  return {
    queue,
    taxonomy,
    activitiesById: Object.fromEntries(
      activities
        .filter(
          (activity): activity is ActivityQuestionDto => activity !== null,
        )
        .map((activity) => [activity.id, activity]),
    ),
  };
}
