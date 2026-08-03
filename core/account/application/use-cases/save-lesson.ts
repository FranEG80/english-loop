import type { IdentityPort } from "../../ports/identity-port";
import type { SavedLessonRepository } from "../../ports/saved-lesson-repository";
import { SavedLesson } from "../../domain/saved-lesson";

/** Guarda una lección para el usuario autenticado. */
export async function saveLesson(
  identity: IdentityPort,
  repository: SavedLessonRepository,
  lessonId: string,
  nowIso: string,
): Promise<void> {
  const actor = await identity.requireActor();
  const existing = await repository.findByUserAndLesson(actor.userId, lessonId);
  if (existing) return;
  await repository.save(
    SavedLesson.create({
      userId: actor.userId,
      lessonId,
      savedAt: nowIso,
    }),
  );
}
