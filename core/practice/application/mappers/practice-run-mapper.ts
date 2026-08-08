import type { PracticeRun } from "../../domain/practice-run";
import type {
  PracticeRunDto,
  PracticeRunErrorDto,
  PracticeRunSummaryDto,
} from "@/core/models/types/practice";

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
  recoveredCount = 0,
  errors: PracticeRunErrorDto[] = [],
  scorePercent = run.originalActivityCount === 0
    ? 0
    : Math.round((correctCount / run.originalActivityCount) * 100),
): PracticeRunSummaryDto {
  return {
    runId: run.id,
    correctCount,
    incorrectCount,
    errors,
    recoveredCount,
    scorePercent,
    coveredSubtopicIds,
    scope: {
      taxonomyNodeId: run.scope.taxonomyNodeId,
      taxonomyPath: run.scope.taxonomyPath,
      level: run.scope.level,
    },
  };
}
