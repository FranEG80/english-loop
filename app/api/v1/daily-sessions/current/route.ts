import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getOrCreateDailySession, localDateForTimezone } from "@/core/learning/application/use-cases/get-or-create-daily-session";
import { toDailySessionDto } from "@/core/learning/application/mappers/daily-session-mapper";
import { dailySessionBodySchema, parseRequest } from "@/server/infrastructure/http/request-schemas";

export const PUT = withErrorHandling(async (request: Request) => {
  await compositionRoot.identity.requireActor();
  const body = parseRequest(dailySessionBodySchema.safeParse(await request.json()));
  const datasetVersion = await compositionRoot.getDatasetVersion();
  const session = await getOrCreateDailySession(
    compositionRoot.identity,
    compositionRoot.dailySessionRepository,
    compositionRoot.userSettingsRepository,
    compositionRoot.getLessonCatalog(),
    compositionRoot.lessonProgressRepository,
    compositionRoot.dailySessionPlanner,
    compositionRoot.idGenerator,
    compositionRoot.clock,
    compositionRoot.domainEventDispatcher,
    datasetVersion,
    { timezone: body.timezone },
  );
  const run = session.practiceRunId
    ? await compositionRoot.practiceRunRepository.findById(session.practiceRunId)
    : undefined;
  return NextResponse.json(toDailySessionDto(session, run ?? undefined));
});

export const GET = withErrorHandling(async () => {
  const actor = await compositionRoot.identity.requireActor();
  const settings = await compositionRoot.userSettingsRepository.findByUserId(actor.userId);
  const timezone = settings?.timezone ?? "UTC";
  const date = localDateForTimezone(compositionRoot.clock.now(), timezone);
  const session = await compositionRoot.dailySessionRepository.findByUserIdAndDate(
    actor.userId,
    date,
  );
  const run = session?.practiceRunId
    ? await compositionRoot.practiceRunRepository.findById(session.practiceRunId)
    : undefined;
  return NextResponse.json(session ? toDailySessionDto(session, run ?? undefined) : null);
});
