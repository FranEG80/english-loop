import type { LocalizedText } from "./locale";
import type { CefrLevel, CefrLevelFilter } from "./level";

export type TaxonomyNodeType = "category" | "topic" | "subtopic" | "skill";

export interface TaxonomyNodeDto {
  id: string;
  type: TaxonomyNodeType;
  label: LocalizedText;
  /** Niveles en los que existe contenido para este nodo (o sus descendientes). */
  levels: CefrLevel[];
  children: TaxonomyNodeDto[];
}

export interface PracticeScopeAvailabilityDto {
  nodeId: string;
  level: CefrLevelFilter;
  availableActivityCount: number;
  minRequiredActivities: number;
  isEligible: boolean;
}
