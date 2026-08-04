import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { listActivitiesPage } from "@/core/content/application/use-cases/list-activities";
import { toActivityQuestionDto } from "@/core/content/application/mappers/activity-question-mapper";
import { isCefrLevelFilter } from "@/core/models/level";
import { ValidationException } from "@/core/shared/exceptions";
import { parsePublicCursorPagination } from "@/server/infrastructure/http/cursor-pagination";

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const taxonomyNodeId = searchParams.get("taxonomyNodeId") ?? undefined;
  const level = searchParams.get("level") ?? undefined;
  const lessonIds = searchParams.getAll("lessonIds");
  if (level && !isCefrLevelFilter(level)) {
    throw new ValidationException("Invalid level", { level: ["Must be B1, B2 or both"] });
  }

  const page = await listActivitiesPage(compositionRoot.getActivityCatalog(), {
    taxonomyNodeId,
    level: level as "B1" | "B2" | "both" | undefined,
    lessonIds: lessonIds.length > 0 ? lessonIds : undefined,
    pagination: parsePublicCursorPagination(searchParams),
  });
  return NextResponse.json({
    ...page,
    items: page.items.map(toActivityQuestionDto),
  });
});
