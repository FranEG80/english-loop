import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getActivity } from "@/core/content/application/use-cases/list-activities";
import { toActivityQuestionDto } from "@/core/content/application/mappers/activity-question-mapper";
import { ResourceNotFoundException } from "@/core/shared/exceptions";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ activityId: string }> }) => {
    const { activityId } = await context.params;
    const activity = await getActivity(
      compositionRoot.getActivityCatalog(),
      activityId,
    );
    if (!activity) {
      throw new ResourceNotFoundException(
        `Activity not found: ${activityId}`,
        "The activity was not found.",
      );
    }
    return NextResponse.json(toActivityQuestionDto(activity));
  },
);
