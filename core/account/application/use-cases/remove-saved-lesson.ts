import type { IdentityPort } from "../../ports/identity-port";
import type { SavedLessonRepository } from "../../ports/saved-lesson-repository";

/** Elimina una lección guardada del usuario autenticado. */
export async function removeSavedLesson(
  identity: IdentityPort,
  repository: SavedLessonRepository,
  lessonId: string,
): Promise<void> {
  const actor = await identity.requireActor();
  await repository.delete(actor.userId, lessonId);
}
