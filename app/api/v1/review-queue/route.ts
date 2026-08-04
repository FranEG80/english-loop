import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getReviewQueue } from "@/core/progress/application/use-cases/get-review-queue";

export const GET = withErrorHandling(async () => {
  const queue = await getReviewQueue(
    compositionRoot.identity,
    compositionRoot.reviewRepository,
    compositionRoot.clock.nowIso(),
    compositionRoot.metrics,
  );
  return NextResponse.json(queue);
});
