import type { PracticeRun } from "../../domain/practice-run";
import type { PracticeRunDto, PracticeRunSummaryDto } from "@/core/models/practice";

/** Convierte un run de dominio a DTO seguro. */
export function toPracticeRunDto(run: PracticeRun): PracticeRunDto {
  return {
    id: run.id,
    scope: {
      taxonomyNodeId: run.scope.taxonomyNodeId,
      taxonomyPath: run.scope.taxonomyPath,
      level: run.scope.level,
    },
    activityIds: run.activityIds,
    currentIndex: run.currentIndex,
    status: run.status,
  };
}

/** Convierte un run a DTO de resumen. */
export function toPracticeRunSummaryDto(
  run: PracticeRun,
  correctCount: number,
  incorrectCount: number,
  coveredSubtopicIds: string[],
): PracticeRunSummaryDto {
  return {
    runId: run.id,
    correctCount,
    incorrectCount,
    coveredSubtopicIds,
    scope: {
      taxonomyNodeId: run.scope.taxonomyNodeId,
      taxonomyPath: run.scope.taxonomyPath,
      level: run.scope.level,
    },
  };
}
