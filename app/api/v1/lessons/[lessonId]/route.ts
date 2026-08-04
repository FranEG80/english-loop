import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getLesson } from "@/core/content/application/use-cases/list-lessons";
import { toLessonDetailDto } from "@/core/content/application/mappers/lesson-mapper";
import { ResourceNotFoundException } from "@/core/shared/exceptions";

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ lessonId: string }> }) => {
    const { lessonId } = await context.params;
    const actor = await compositionRoot.identity.getActor();
    const lesson = await getLesson(compositionRoot.getLessonCatalog(actor), lessonId);
    if (!lesson) {
      throw new ResourceNotFoundException(
        `Lesson not found: ${lessonId}`,
        "The lesson was not found.",
      );
    }
    return NextResponse.json(toLessonDetailDto(lesson));
  },
);
