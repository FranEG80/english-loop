"use server";

import { revalidatePath } from "next/cache";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { saveLesson } from "@/core/account/application/use-cases/save-lesson";
import { removeSavedLesson } from "@/core/account/application/use-cases/remove-saved-lesson";

/** Server Action para guardar una lección. */
export async function saveLessonAction(lessonId: string) {
  await saveLesson(
    compositionRoot.identity,
    compositionRoot.savedLessonRepository,
    lessonId,
    compositionRoot.clock.nowIso(),
  );
  revalidatePath("/lessons");
  return { saved: true };
}

/** Server Action para quitar una lección guardada. */
export async function removeSavedLessonAction(lessonId: string) {
  await removeSavedLesson(
    compositionRoot.identity,
    compositionRoot.savedLessonRepository,
    lessonId,
  );
  revalidatePath("/lessons");
  return { saved: false };
}
