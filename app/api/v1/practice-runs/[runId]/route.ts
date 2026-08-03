import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getPracticeRun } from "@/core/practice/application/use-cases/get-practice-run";
import { toPracticeRunDto } from "@/core/practice/application/mappers/practice-run-mapper";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ runId: string }> }) => {
    const { runId } = await context.params;
    const run = await getPracticeRun(
      compositionRoot.identity,
      compositionRoot.practiceRunRepository,
      runId,
    );
    return NextResponse.json(toPracticeRunDto(run));
  },
);
