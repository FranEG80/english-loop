import { NextResponse } from "next/server";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { withErrorHandling } from "@/server/infrastructure/http/with-error-handling";
import { createFocusedPracticeRun } from "@/core/practice/application/use-cases/create-focused-practice-run";
import { toPracticeRunDto } from "@/core/practice/application/mappers/practice-run-mapper";
import { ValidationException } from "@/core/shared/exceptions";
import type { CefrLevelFilter } from "@/core/models/level";
import { isCefrLevelFilter } from "@/core/models/level";
import { createPracticeRunBodySchema, parseRequest } from "@/server/infrastructure/http/request-schemas";

export const POST = withErrorHandling(async (request: Request) => {
  const body = parseRequest(createPracticeRunBodySchema.safeParse(await request.json()));

  if (!isCefrLevelFilter(body.level)) {
    throw new ValidationException("Invalid level", { level: ["Must be B1, B2 or both"] });
  }

  const datasetVersion = await compositionRoot.getDatasetVersion();
  const { run } = await createFocusedPracticeRun(
    compositionRoot.identity,
    compositionRoot.practiceRunRepository,
    compositionRoot.getActivityCatalog(),
    compositionRoot.getTaxonomyCatalog(),
    compositionRoot.practiceRunPlanner,
    compositionRoot.idGenerator,
    compositionRoot.clock,
    datasetVersion,
    {
      taxonomyNodeId: body.taxonomyNodeId,
      level: body.level,
      sessionSize: body.sessionSize,
    },
  );

  return NextResponse.json(toPracticeRunDto(run), { status: 201 });
});
