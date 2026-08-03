import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getActivityHistory } from "@/core/progress/application/use-cases/get-activity-history";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ activityId: string }> }) => {
    const { activityId } = await context.params;
    return NextResponse.json(
      await getActivityHistory(
        compositionRoot.identity,
        compositionRoot.attemptRepository,
        activityId,
      ),
    );
  },
);
