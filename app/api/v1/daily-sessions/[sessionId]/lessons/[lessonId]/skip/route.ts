import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { skipLesson } from "@/core/learning/application/use-cases/skip-lesson";
import { toDailySessionDto } from "@/core/learning/application/mappers/daily-session-mapper";

export const POST = withErrorHandling(
  async (
    _request: Request,
    context: {
      params: Promise<{ sessionId: string; lessonId: string }>;
    },
  ) => {
    await compositionRoot.identity.requireActor();
    const { sessionId, lessonId } = await context.params;
    const session = await skipLesson(
      compositionRoot.identity,
      compositionRoot.unitOfWork,
      compositionRoot.dailySessionRepository,
      sessionId,
      lessonId,
      compositionRoot.clock.nowIso(),
      compositionRoot.domainEventDispatcher,
    );
    return NextResponse.json(toDailySessionDto(session));
  },
);
