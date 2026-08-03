import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { getScopeAvailability } from "@/core/content/application/use-cases/get-scope-availability";
import { isCefrLevelFilter, type CefrLevelFilter } from "@/core/models/level";
import { ValidationException } from "@/core/shared/exceptions";

export const GET = withErrorHandling(
  async (request: Request, context: { params: Promise<{ nodeId: string }> }) => {
    const { nodeId } = await context.params;
    const { searchParams } = new URL(request.url);
    const requested = searchParams.get("level");
    if (requested && !isCefrLevelFilter(requested)) {
      throw new ValidationException("Invalid level", { level: ["Must be B1, B2 or both"] });
    }
    const levels: CefrLevelFilter[] = requested
      ? [requested as CefrLevelFilter]
      : ["B1", "B2", "both"];
    const availability = await Promise.all(
      levels.map((level) => getScopeAvailability(
        compositionRoot.getActivityCatalog(),
        compositionRoot.getTaxonomyCatalog(),
        nodeId,
        level,
      )),
    );
    return NextResponse.json(availability);
  },
);
