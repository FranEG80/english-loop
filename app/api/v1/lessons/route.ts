import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { listLessonsPage } from "@/core/content/application/use-cases/list-lessons";
import { toLessonSummaryDto } from "@/core/content/application/mappers/lesson-mapper";
import { isCefrLevel } from "@/core/models/level";
import { ValidationException } from "@/core/shared/exceptions";
import { parsePublicCursorPagination } from "@/server/infrastructure/http/cursor-pagination";

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const level = searchParams.get("level") ?? undefined;
  if (level && !isCefrLevel(level)) {
    throw new ValidationException("Invalid level", { level: ["Must be B1 or B2"] });
  }

  const page = await listLessonsPage(compositionRoot.getLessonCatalog(), {
    category,
    level: level as "B1" | "B2" | undefined,
    pagination: parsePublicCursorPagination(searchParams),
  });
  return NextResponse.json({
    ...page,
    items: page.items.map(toLessonSummaryDto),
  });
});
