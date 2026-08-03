import type { CefrLevelFilter } from "../level";
import type { SessionSize } from "../session-size";

export interface FocusedPracticeScopeDto {
  taxonomyNodeId: string;
  /** IDs de los ancestros hasta la raíz, en orden; útil para el breadcrumb. */
  taxonomyPath: string[];
  level: CefrLevelFilter;
}

export interface CreateFocusedPracticeRunDto {
  taxonomyNodeId: string;
  level: CefrLevelFilter;
  sessionSize: SessionSize;
}

export type PracticeRunStatus = "in_progress" | "completed";

export interface PracticeRunDto {
  id: string;
  scope: FocusedPracticeScopeDto;
  activityIds: string[];
  currentIndex: number;
  status: PracticeRunStatus;
}

export interface PracticeRunSummaryDto {
  runId: string;
  correctCount: number;
  incorrectCount: number;
  /** Aciertos de la única repetición inmediata permitida. */
  recoveredCount: number;
  /** Porcentaje calculado sobre las actividades originales. */
  scorePercent: number;
  /** IDs de subtemas cubiertos durante la sesión. */
  coveredSubtopicIds: string[];
  scope: FocusedPracticeScopeDto;
}
