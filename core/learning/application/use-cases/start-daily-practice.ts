import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import type { ActivityCatalogPort } from "@/core/content/ports/catalog-ports";
import { type ClockPort, type DomainEventDispatcherPort, type IdGeneratorPort, type UnitOfWorkPort, UniqueId } from "@/core/shared/kernel";
import type { PracticeRunRepository } from "@/core/practice/ports/practice-run-repository";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import type { DailySessionRepository } from "../../ports/daily-session-repository";
import type { DailyPracticePlanner } from "../../domain/daily-practice-planner";
import { ForbiddenException, ResourceNotFoundException } from "@/core/shared/exceptions";

export interface StartDailyPracticeResult {
  sessionId: string;
  run: PracticeRun;
}

/** Crea el run DAILY al salir de la fase de lecciones, dentro de una UoW. */
export async function startDailyPractice(
  identity: IdentityPort,
  unitOfWork: UnitOfWorkPort,
  sessionRepository: DailySessionRepository,
  runRepository: PracticeRunRepository,
  userSettingsRepository: UserSettingsRepository,
  activityCatalog: ActivityCatalogPort,
  planner: DailyPracticePlanner,
  idGenerator: IdGeneratorPort,
  clock: ClockPort,
  domainEventDispatcher: DomainEventDispatcherPort,
  datasetVersion: string,
  sessionId: string,
): Promise<StartDailyPracticeResult> {
  const actor = await identity.requireActor();
  const { result, events } = await unitOfWork.transaction(async () => {
    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      throw new ResourceNotFoundException(
        `Daily session not found: ${sessionId}`,
        "The daily session was not found.",
      );
    }
    if (session.userId !== actor.userId) {
      throw new ForbiddenException(
        "Cannot access another user's daily session",
        "You do not have access to this daily session.",
      );
    }
    if (session.practiceRunId) {
      const existingRun = await runRepository.findById(session.practiceRunId);
      if (existingRun) return { result: { sessionId, run: existingRun }, events: [] };
    }

    const settings = await userSettingsRepository.findByUserId(actor.userId);
    const level = settings?.activeLevels[0] ?? actor.activeLevels[0] ?? "B1";
    const activityCount = settings?.dailyGoalActivities ?? 10;
    const activityIds = await planner.plan(activityCatalog, {
      lessonIds: session.lessons.map((lesson) => lesson.lessonId),
      level,
      count: activityCount,
    });
    const run = PracticeRun.create({
      id: UniqueId.create(idGenerator).toString(),
      userId: actor.userId,
      mode: "DAILY",
      scope: {
        level,
        taxonomyNodeId: "daily",
        taxonomyPath: [],
        descendantIds: [],
        requestedCount: activityCount as 5 | 10 | 15 | 20,
      },
      activityIds,
      currentIndex: 0,
      status: "in_progress",
      datasetVersion,
      dailySessionId: session.id,
      createdAt: clock.nowIso(),
    });
    session.startPracticePhase();
    session.attachPracticeRun(run.id);
    session.recordPracticeStarted(clock.nowIso(), run.id);
    await runRepository.save(run);
    await sessionRepository.save(session);
    return { result: { sessionId, run }, events: session.pullDomainEvents() };
  });

  if (events.length > 0) await domainEventDispatcher.dispatch(events);
  return result;
}
