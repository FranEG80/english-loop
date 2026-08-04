import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getPracticeRunSummary } from "@/core/practice/application/use-cases/get-practice-run-summary";
import { toPracticeRunSummaryDto } from "@/core/practice/application/mappers/practice-run-mapper";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ runId: string }> }) => {
    const { runId } = await context.params;
    const actor = await compositionRoot.identity.requireActor();
    const runSummary = await getPracticeRunSummary(
      compositionRoot.identity,
      compositionRoot.practiceRunRepository,
      compositionRoot.attemptRepository,
      compositionRoot.getActivityCatalog(actor),
      runId,
    );
    return NextResponse.json(
      toPracticeRunSummaryDto(
        runSummary.run,
        runSummary.correctCount,
        runSummary.incorrectCount,
        runSummary.coveredSubtopicIds,
        runSummary.recoveredCount,
        runSummary.scorePercent,
      ),
    );
  },
);
