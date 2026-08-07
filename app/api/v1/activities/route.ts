import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { searchActivitiesPage } from "@/core/content/application/use-cases/list-activities";
import { toActivityQuestionDto } from "@/core/content/application/mappers/activity-question-mapper";
import { isCefrLevelFilter } from "@/core/models/level";
import {
  ACTIVITY_TYPES,
  ACTIVITY_PRESENTATIONS,
  type ActivityType,
  type ActivityPresentation,
} from "@/core/models/types/activity";
import { ValidationException } from "@/core/shared/exceptions";
import { parsePublicNumberedPagination } from "@/server/infrastructure/http/cursor-pagination";

function toCatalogActivityType(type?: ActivityType): string | undefined {
  return type === "multiple_choice" ? "multiple_select" : type;
}

export const GET = withErrorHandling(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const taxonomyNodeId = searchParams.get("taxonomyNodeId") ?? undefined;
  const level = searchParams.get("level") ?? undefined;
  const lessonIds = searchParams.getAll("lessonIds");
  const query = searchParams.get("q")?.trim() || undefined;
  const type = searchParams.get("type") ?? undefined;
  const presentation = searchParams.get("interaction") ?? undefined;
  if (level && !isCefrLevelFilter(level)) {
    throw new ValidationException("Invalid level", { level: ["Must be B1, B2 or both"] });
  }
  if (type && !ACTIVITY_TYPES.includes(type as ActivityType)) {
    throw new ValidationException("Invalid activity type", {
      type: ["Must be a supported activity type"],
    });
  }
  if (
    presentation &&
    !ACTIVITY_PRESENTATIONS.includes(presentation as ActivityPresentation)
  ) {
    throw new ValidationException("Invalid interaction mode", {
      interaction: ["Must be a supported interaction mode"],
    });
  }

  const actor = await compositionRoot.identity.getActor();
  const taxonomyNodeIds = taxonomyNodeId
    ? (await compositionRoot.getTaxonomyCatalog(actor).resolveNodeWithDescendants(
        taxonomyNodeId,
      )).map((node) => node.id)
    : undefined;
  const page = await searchActivitiesPage(compositionRoot.getActivityCatalog(actor), {
    taxonomyNodeId,
    taxonomyNodeIds: taxonomyNodeId
      ? taxonomyNodeIds?.length
        ? taxonomyNodeIds
        : ["__unknown_taxonomy_node__"]
      : undefined,
    level: level as "B1" | "B2" | "both" | undefined,
    lessonIds: lessonIds.length > 0 ? lessonIds : undefined,
    query,
    activityType: toCatalogActivityType(type as ActivityType | undefined),
    presentation,
    pagination: parsePublicNumberedPagination(searchParams),
  });
  return NextResponse.json({
    ...page,
    items: page.items.map(toActivityQuestionDto),
  });
});
