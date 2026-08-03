import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { saveLesson } from "@/core/account/application/use-cases/save-lesson";
import { removeSavedLesson } from "@/core/account/application/use-cases/remove-saved-lesson";

export const POST = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ lessonId: string }> }) => {
    const { lessonId } = await context.params;
    await saveLesson(
      compositionRoot.identity,
      compositionRoot.savedLessonRepository,
      lessonId,
      compositionRoot.clock.nowIso(),
    );
    return NextResponse.json({ saved: true });
  },
);

export const DELETE = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ lessonId: string }> }) => {
    const { lessonId } = await context.params;
    await removeSavedLesson(
      compositionRoot.identity,
      compositionRoot.savedLessonRepository,
      lessonId,
    );
    return NextResponse.json({ saved: false });
  },
);
