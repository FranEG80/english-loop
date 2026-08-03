import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { DomainEventDispatcherPort, UnitOfWorkPort } from "@/core/shared/kernel";
import type { DailySessionRepository } from "../../ports/daily-session-repository";
import type { LessonProgressRepository } from "../../ports/lesson-progress-repository";
import type { DailySession } from "../../domain/daily-session";
import { ResourceNotFoundException, ForbiddenException } from "@/core/shared/exceptions";

export async function completeLesson(
  identity: IdentityPort,
  unitOfWork: UnitOfWorkPort,
  sessionRepository: DailySessionRepository,
  lessonProgressRepository: LessonProgressRepository,
  sessionId: string,
  lessonId: string,
  nowIso: string,
  domainEventDispatcher: DomainEventDispatcherPort,
): Promise<DailySession> {
  const actor = await identity.requireActor();
  const { session, events } = await unitOfWork.transaction(async () => {
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
    session.completeLesson(lessonId, nowIso);
    await sessionRepository.save(session);
    await lessonProgressRepository.upsert({
      userId: actor.userId,
      lessonId,
      viewed: true,
      viewedAt: nowIso,
      errorsPending: 0,
    });
    return { session, events: session.pullDomainEvents() };
  });
  await domainEventDispatcher.dispatch(events);
  return session;
}
