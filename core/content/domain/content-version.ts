/** Estado de publicación de un elemento de contenido. */
export type ContentStatus = "draft" | "reviewed" | "published";

/** Versión del esquema de contenido soportada. */
export const CONTENT_SCHEMA_VERSION = "1.0.0";

/** Versión del dataset que el catálogo está sirviendo. */
export interface ContentVersion {
  datasetVersion: string;
  schemaVersion: string;
}
