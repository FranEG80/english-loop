import "server-only";

/**
 * Server boundary for the catalog writer. The implementation is kept in a
 * runtime-neutral module so the dataset CLI can use the same code without
 * weakening the Next.js server-only boundary.
 */
export { PrismaCatalogWriteAdapter } from "./prisma-catalog-write-core";
