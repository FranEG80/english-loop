import type { CefrLevel } from "@/core/models/level";
import type { LocalizedText } from "@/core/models/locale";

export type TaxonomyNodeKind = "category" | "topic" | "subtopic" | "skill";

/** Nodo de taxonomía tal como se sirve al cliente. */
export interface TaxonomyNode {
  id: string;
  parentId: string | null;
  kind: TaxonomyNodeKind;
  labels: LocalizedText;
  levels: CefrLevel[];
  selectableForPractice: boolean;
  order: number;
  children: TaxonomyNode[];
}
