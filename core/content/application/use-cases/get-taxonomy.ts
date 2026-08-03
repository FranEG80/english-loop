import type { TaxonomyNode } from "../../domain/types/taxonomy";
import type { TaxonomyCatalogPort } from "../../ports/catalog-ports";

/** Devuelve el árbol de taxonomía completo. */
export async function getTaxonomyTree(
  catalog: TaxonomyCatalogPort,
): Promise<TaxonomyNode[]> {
  return catalog.getTaxonomyTree();
}

/** Resuelve un nodo y sus descendientes seleccionables. */
export async function getNodeWithDescendants(
  catalog: TaxonomyCatalogPort,
  nodeId: string,
): Promise<TaxonomyNode[]> {
  return catalog.resolveNodeWithDescendants(nodeId);
}

export async function getTaxonomyNodePath(
  catalog: TaxonomyCatalogPort,
  nodeId: string,
): Promise<TaxonomyNode[]> {
  return catalog.getNodePath(nodeId);
}
