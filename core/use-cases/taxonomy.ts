import type { Locale, TaxonomyNodeDto } from "@/core/models";

export function findTaxonomyNode(
  nodes: TaxonomyNodeDto[],
  nodeId: string,
): TaxonomyNodeDto | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findTaxonomyNode(node.children, nodeId);
    if (child) return child;
  }
  return null;
}

export function taxonomyLabel(
  nodes: TaxonomyNodeDto[],
  nodeId: string,
  locale: Locale,
): string {
  return findTaxonomyNode(nodes, nodeId)?.label[locale] ?? nodeId;
}
