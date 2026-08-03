import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { listSavedLessons } from "@/core/account/application/use-cases/list-saved-lessons";

export const GET = withErrorHandling(async () => {
  const lessons = await listSavedLessons(
    compositionRoot.identity,
    compositionRoot.savedLessonRepository,
  );
  return NextResponse.json(lessons.map((lesson) => lesson.lessonId));
});
