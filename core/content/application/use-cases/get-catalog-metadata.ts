import type { CatalogMetadata, CatalogMetadataPort } from "../../ports/catalog-ports";

export function getCatalogMetadata(
  catalog: CatalogMetadataPort,
): Promise<CatalogMetadata> {
  return catalog.getCatalogMetadata();
}
