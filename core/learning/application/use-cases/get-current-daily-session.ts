import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { DailySessionRepository } from "../../ports/daily-session-repository";
import type { DailySession } from "../../domain/daily-session";
/** Obtiene la sesión diaria actual del usuario para la fecha local. */
export async function getCurrentDailySession(
  identity: IdentityPort,
  sessionRepository: DailySessionRepository,
  date: string,
): Promise<DailySession | null> {
  const actor = await identity.requireActor();
  return sessionRepository.findByUserIdAndDate(actor.userId, date);
}
