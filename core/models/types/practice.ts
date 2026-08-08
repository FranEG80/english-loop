import type { CefrLevelFilter } from "../level";
import type { SessionSize } from "../session-size";
import type { AttemptItemResultDto } from "./attempt";

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

/**
 * Un fallo de la sesión, con su desglose y su explicación. Es lo que convierte
 * el resumen en algo útil: dos números no dicen en qué te equivocaste.
 */
export interface PracticeRunErrorDto {
  activityId: string;
  /** Enunciado de la actividad, para reconocerla sin abrirla. */
  prompt: string;
  explanation: string;
  /** Desglose por hueco, carta o ronda cuando la actividad tiene sub-ítems. */
  items: AttemptItemResultDto[];
}

export interface PracticeRunSummaryDto {
  runId: string;
  correctCount: number;
  incorrectCount: number;
  /** Todos los fallos de la sesión, en orden de respuesta. */
  errors: PracticeRunErrorDto[];
  /** Aciertos de la única repetición inmediata permitida. */
  recoveredCount: number;
  /** Porcentaje calculado sobre las actividades originales. */
  scorePercent: number;
  /** IDs de subtemas cubiertos durante la sesión. */
  coveredSubtopicIds: string[];
  scope: FocusedPracticeScopeDto;
}
