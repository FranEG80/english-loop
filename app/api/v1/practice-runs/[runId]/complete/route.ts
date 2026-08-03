import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { completePracticeRun } from "@/core/practice/application/use-cases/complete-practice-run";
import { toPracticeRunDto } from "@/core/practice/application/mappers/practice-run-mapper";

export const POST = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ runId: string }> }) => {
    const { runId } = await context.params;
    const run = await completePracticeRun(
      compositionRoot.identity,
      compositionRoot.practiceRunRepository,
      runId,
    );
    return NextResponse.json(toPracticeRunDto(run));
  },
);
