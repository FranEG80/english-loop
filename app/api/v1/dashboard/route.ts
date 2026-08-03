import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getDashboardSummary } from "@/core/progress/application/use-cases/get-dashboard-summary";

export const GET = withErrorHandling(async () => {
  const summary = await getDashboardSummary(
    compositionRoot.identity,
    compositionRoot.progressRepository,
    compositionRoot.reviewRepository,
    compositionRoot.clock.nowIso(),
  );
  return NextResponse.json(summary);
});
