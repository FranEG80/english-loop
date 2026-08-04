"use server";

import { revalidatePath } from "next/cache";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { getOrCreateDailySession } from "@/core/learning/application/use-cases/get-or-create-daily-session";
import { completeLesson } from "@/core/learning/application/use-cases/complete-lesson";
import { skipLesson } from "@/core/learning/application/use-cases/skip-lesson";
import { completeDailySession } from "@/core/learning/application/use-cases/complete-daily-session";
import { startDailyPractice } from "@/core/learning/application/use-cases/start-daily-practice";
import { toDailySessionDto } from "@/core/learning/application/mappers/daily-session-mapper";

export interface DailySessionInput {
  date?: string;
  timezone?: string;
}

/** Server Action para obtener/crear la sesión diaria. */
export async function getOrCreateDailySessionAction(input: DailySessionInput = {}) {
  const timezone = input.timezone ?? "UTC";
  const actor = await compositionRoot.identity.requireActor();
  const datasetVersion = await compositionRoot.getDatasetVersion(actor);
  const session = await getOrCreateDailySession(
    compositionRoot.identity,
    compositionRoot.dailySessionRepository,
    compositionRoot.userSettingsRepository,
    compositionRoot.getLessonCatalog(actor),
    compositionRoot.lessonProgressRepository,
    compositionRoot.dailySessionPlanner,
    compositionRoot.idGenerator,
    compositionRoot.clock,
    compositionRoot.domainEventDispatcher,
    datasetVersion,
    { timezone },
    compositionRoot.metrics,
  );
  const run = session.practiceRunId
    ? await compositionRoot.practiceRunRepository.findById(session.practiceRunId)
    : undefined;
  return toDailySessionDto(session, run ?? undefined);
}

export async function startDailyPracticeAction(sessionId: string) {
  const actor = await compositionRoot.identity.requireActor();
  const datasetVersion = await compositionRoot.getDatasetVersion(actor);
  const { run } = await startDailyPractice(
    compositionRoot.identity,
    compositionRoot.unitOfWork,
    compositionRoot.dailySessionRepository,
    compositionRoot.practiceRunRepository,
    compositionRoot.userSettingsRepository,
    compositionRoot.getActivityCatalog(actor),
    compositionRoot.dailyPracticePlanner,
    compositionRoot.idGenerator,
    compositionRoot.clock,
    compositionRoot.domainEventDispatcher,
    datasetVersion,
    sessionId,
    compositionRoot.metrics,
  );
  revalidatePath("/daily");
  const session = await compositionRoot.dailySessionRepository.findById(sessionId);
  return session ? toDailySessionDto(session, run) : toDailySessionDto(
    (await compositionRoot.dailySessionRepository.findById(sessionId))!,
    run,
  );
}

/** Server Action para completar una lección. */
export async function completeLessonAction(sessionId: string, lessonId: string) {
  const session = await completeLesson(
    compositionRoot.identity,
    compositionRoot.unitOfWork,
    compositionRoot.dailySessionRepository,
    compositionRoot.lessonProgressRepository,
    sessionId,
    lessonId,
    compositionRoot.clock.nowIso(),
    compositionRoot.domainEventDispatcher,
  );
  revalidatePath("/daily");
  const run = session.practiceRunId
    ? await compositionRoot.practiceRunRepository.findById(session.practiceRunId)
    : undefined;
  return toDailySessionDto(session, run ?? undefined);
}

/** Server Action para omitir una lección. */
export async function skipLessonAction(sessionId: string, lessonId: string) {
  const session = await skipLesson(
    compositionRoot.identity,
    compositionRoot.unitOfWork,
    compositionRoot.dailySessionRepository,
    sessionId,
    lessonId,
    compositionRoot.clock.nowIso(),
    compositionRoot.domainEventDispatcher,
  );
  revalidatePath("/daily");
  const run = session.practiceRunId
    ? await compositionRoot.practiceRunRepository.findById(session.practiceRunId)
    : undefined;
  return toDailySessionDto(session, run ?? undefined);
}

/** Server Action para completar la sesión diaria. */
export async function completeDailySessionAction(sessionId: string) {
  const session = await completeDailySession(
    compositionRoot.identity,
    compositionRoot.unitOfWork,
    compositionRoot.dailySessionRepository,
    sessionId,
    compositionRoot.clock.nowIso(),
    compositionRoot.domainEventDispatcher,
    compositionRoot.metrics,
  );
  revalidatePath("/daily");
  const run = session.practiceRunId
    ? await compositionRoot.practiceRunRepository.findById(session.practiceRunId)
    : undefined;
  return toDailySessionDto(session, run ?? undefined);
}
