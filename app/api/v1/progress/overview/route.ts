import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getProgressOverview } from "@/core/progress/application/use-cases/get-progress-overview";

export const GET = withErrorHandling(async () => {
  const overview = await getProgressOverview(
    compositionRoot.identity,
    compositionRoot.progressRepository,
    compositionRoot.reviewRepository,
    compositionRoot.clock.nowIso(),
  );
  return NextResponse.json(overview);
});
