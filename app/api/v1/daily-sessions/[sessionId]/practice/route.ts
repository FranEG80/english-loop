import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { startDailyPractice } from "@/core/learning/application/use-cases/start-daily-practice";
import { toDailySessionDto } from "@/core/learning/application/mappers/daily-session-mapper";

export const POST = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ sessionId: string }> }) => {
    await compositionRoot.identity.requireActor();
    const { sessionId } = await context.params;
    const datasetVersion = await compositionRoot.getDatasetVersion();
    const { run } = await startDailyPractice(
      compositionRoot.identity,
      compositionRoot.unitOfWork,
      compositionRoot.dailySessionRepository,
      compositionRoot.practiceRunRepository,
      compositionRoot.userSettingsRepository,
      compositionRoot.getActivityCatalog(),
      compositionRoot.dailyPracticePlanner,
      compositionRoot.idGenerator,
      compositionRoot.clock,
      compositionRoot.domainEventDispatcher,
      datasetVersion,
      sessionId,
    );
    const session = await compositionRoot.dailySessionRepository.findById(sessionId);
    return NextResponse.json(session ? toDailySessionDto(session, run) : null);
  },
);
