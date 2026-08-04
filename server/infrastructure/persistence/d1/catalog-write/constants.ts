/** D1 batches are deliberately kept below the platform statement limit. */
export const D1_CATALOG_BATCH_SIZE = 80;
/** Leaves room for the authenticated JSON envelope when sizing seed chunks. */
export const D1_CATALOG_HTTP_BODY_MARGIN_BYTES = 4_096;
export const CATALOG_RELEASE_PREPARING = "preparing";
export const CATALOG_RELEASE_PUBLISHED = "published";
export const CATALOG_IMPORT_STARTED = "started";
export const CATALOG_IMPORT_COMPLETED = "completed";
export const CATALOG_IMPORT_FAILED = "failed";
export const ACTIVE_PUBLICATION_ID = "active";
