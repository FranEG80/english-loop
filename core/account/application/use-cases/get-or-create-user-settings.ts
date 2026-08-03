import type { IdentityPort } from "../../ports/identity-port";
import type { UserSettingsRepository } from "../../ports/user-settings-repository";
import { UserSettings } from "../../domain/user-settings";

/**
 * Obtiene los settings del usuario autenticado, creándolos con valores
 * predeterminados de forma idempotente en el primer acceso.
 */
export async function getOrCreateUserSettings(
  identity: IdentityPort,
  repository: UserSettingsRepository,
): Promise<UserSettings> {
  const actor = await identity.requireActor();
  const existing = await repository.findByUserId(actor.userId);
  if (existing) return existing;

  const defaults = UserSettings.defaults(actor.userId);
  await repository.save(defaults);
  return defaults;
}
