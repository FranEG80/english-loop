import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { submitAttemptTransaction } from "@/core/progress/application/use-cases/submit-attempt-transaction";
import { getAttemptFeedback } from "@/core/practice/application/use-cases/get-attempt-feedback";
import { parseRequest, attemptBodySchema } from "@/server/infrastructure/http/request-schemas";
import { ResourceNotFoundException } from "@/core/shared/exceptions";

export const POST = withErrorHandling(
  async (request: Request, context: { params: Promise<{ sessionId: string }> }) => {
    const { sessionId } = await context.params;
    const body = parseRequest(attemptBodySchema.safeParse(await request.json()));
    const session = await compositionRoot.dailySessionRepository.findById(sessionId);
    if (!session?.practiceRunId) {
      throw new ResourceNotFoundException(
        `Daily practice run not found for session: ${sessionId}`,
        "The daily practice has not started yet.",
      );
    }
    const { attempt } = await submitAttemptTransaction(
      compositionRoot.identity,
      compositionRoot.unitOfWork,
      compositionRoot.attemptRepository,
      compositionRoot.practiceRunRepository,
      compositionRoot.getActivityCatalog(),
      compositionRoot.progressRepository,
      compositionRoot.reviewRepository,
      compositionRoot.getTaxonomyCatalog(),
      compositionRoot.idGenerator,
      compositionRoot.clock,
      compositionRoot.domainEventDispatcher,
      "1.0.0",
      { runId: session.practiceRunId, ...body },
      { dailySessionRepository: compositionRoot.dailySessionRepository },
    );
    return NextResponse.json(
      await getAttemptFeedback(compositionRoot.getActivityCatalog(), attempt),
    );
  },
);
