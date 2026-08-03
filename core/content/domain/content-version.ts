/** Estado de publicación de un elemento de contenido. */
export type ContentStatus = "draft" | "reviewed" | "published";

export const PUBLISHED_CONTENT_STATUS = "published" as const;
export const ACTIVE_CATALOG_PUBLICATION_ID = "active";
export const UNKNOWN_DATASET_VERSION = "unknown";

/** Versión del esquema de contenido soportada. */
export const CONTENT_SCHEMA_VERSION = "1.0.0";

/** Versión del dataset que el catálogo está sirviendo. */
export interface ContentVersion {
  datasetVersion: string;
  schemaVersion: string;
}
