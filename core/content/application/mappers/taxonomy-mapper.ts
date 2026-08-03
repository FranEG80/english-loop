import type { TaxonomyNode } from "../../domain/types/taxonomy";
import type { TaxonomyNodeDto } from "@/core/models/types/taxonomy";

/** Convierte un nodo de taxonomía de dominio a DTO seguro. */
export function toTaxonomyNodeDto(node: TaxonomyNode): TaxonomyNodeDto {
  return {
    id: node.id,
    type: node.kind,
    label: node.labels,
    levels: node.levels,
    children: node.children.map(toTaxonomyNodeDto),
  };
}
