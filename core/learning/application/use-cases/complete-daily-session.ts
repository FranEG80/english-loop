import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { DailySessionRepository } from "../../ports/daily-session-repository";
import type { DailySession } from "../../domain/daily-session";
import type { DomainEventDispatcherPort, PedagogicalMetricsPort, UnitOfWorkPort } from "@/core/shared/kernel";
import { ResourceNotFoundException, ForbiddenException } from "@/core/shared/exceptions";

export async function completeDailySession(
  identity: IdentityPort,
  unitOfWork: UnitOfWorkPort,
  sessionRepository: DailySessionRepository,
  sessionId: string,
  nowIso: string,
  domainEventDispatcher: DomainEventDispatcherPort,
  metrics?: PedagogicalMetricsPort,
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
    session.complete(nowIso);
    await sessionRepository.save(session);
    return { session, events: session.pullDomainEvents() };
  });
  await domainEventDispatcher.dispatch(events);
  metrics?.recordPedagogicalEvent("daily_session.completed");
  return session;
}
