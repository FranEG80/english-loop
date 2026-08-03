import type { IdentityPort } from "../../ports/identity-port";
import type { SavedLessonRepository } from "../../ports/saved-lesson-repository";
import type { SavedLesson } from "../../domain/saved-lesson";

/** Lista las lecciones guardadas del usuario autenticado. */
export async function listSavedLessons(
  identity: IdentityPort,
  repository: SavedLessonRepository,
): Promise<SavedLesson[]> {
  const actor = await identity.requireActor();
  return repository.findByUserId(actor.userId);
}
