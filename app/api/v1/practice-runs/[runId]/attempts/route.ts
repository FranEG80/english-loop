import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { submitAttemptTransaction } from "@/core/progress/application/use-cases/submit-attempt-transaction";
import { getAttemptFeedback } from "@/core/practice/application/use-cases/get-attempt-feedback";
import { parseRequest, attemptBodySchema } from "@/server/infrastructure/http/request-schemas";
import { CONTENT_SCHEMA_VERSION } from "@/core/content/domain/content-version";

export const POST = withErrorHandling(
  async (request: Request, context: { params: Promise<{ runId: string }> }) => {
    const actor = await compositionRoot.identity.requireActor();
    const { runId } = await context.params;
    const body = parseRequest(attemptBodySchema.safeParse(await request.json()));

    if (await compositionRoot.attemptRateLimiter.isLimited(`attempt:${actor.userId}`)) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many attempts. Please try again later.",
            fieldErrors: {},
            requestId: compositionRoot.idGenerator.generate(),
          },
        },
        { status: 429 },
      );
    }


    const { attempt } = await submitAttemptTransaction(
      compositionRoot.identity,
      compositionRoot.unitOfWork,
      compositionRoot.attemptRepository,
      compositionRoot.practiceRunRepository,
      compositionRoot.getActivityCatalog(actor),
      compositionRoot.progressRepository,
      compositionRoot.reviewRepository,
      compositionRoot.getTaxonomyCatalog(actor),
      compositionRoot.idGenerator,
      compositionRoot.clock,
      compositionRoot.domainEventDispatcher,
      CONTENT_SCHEMA_VERSION,
      {
        runId,
        activityId: body.activityId,
        idempotencyKey: body.idempotencyKey,
        response: body.response,
      },
      {
        dailySessionRepository: compositionRoot.dailySessionRepository,
        lessonProgressRepository: compositionRoot.lessonProgressRepository,
        metrics: compositionRoot.metrics,
      },
    );

    const feedback = await getAttemptFeedback(
      compositionRoot.getActivityCatalog(actor),
      attempt,
      compositionRoot.reviewRepository,
    );
    return NextResponse.json(feedback);
  },
);
