import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { completeDailySession } from "@/core/learning/application/use-cases/complete-daily-session";
import { toDailySessionDto } from "@/core/learning/application/mappers/daily-session-mapper";

export const POST = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ sessionId: string }> }) => {
    await compositionRoot.identity.requireActor();
    const { sessionId } = await context.params;
    const session = await completeDailySession(
      compositionRoot.identity,
      compositionRoot.unitOfWork,
      compositionRoot.dailySessionRepository,
      sessionId,
      compositionRoot.clock.nowIso(),
      compositionRoot.domainEventDispatcher,
      compositionRoot.metrics,
    );
    return NextResponse.json(toDailySessionDto(session));
  },
);
