import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { ACTIVE_PUBLICATION_ID, CATALOG_IMPORT_COMPLETED, CATALOG_RELEASE_PUBLISHED } from "./constants";
import { statement } from "./shared";

export function publishStatements(database: D1DatabaseLike, releaseId: string, importId: string, result: string): D1PreparedStatement[] {
  return [
    statement(database, "UPDATE CatalogRelease SET status = ?, publishedAt = CURRENT_TIMESTAMP WHERE id = ?", [CATALOG_RELEASE_PUBLISHED, releaseId]),
    statement(database, `INSERT INTO CatalogPublication (id, releaseId, publishedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET releaseId = excluded.releaseId, publishedAt = CURRENT_TIMESTAMP`, [ACTIVE_PUBLICATION_ID, releaseId]),
    statement(database, "UPDATE DatasetImport SET status = ?, finishedAt = CURRENT_TIMESTAMP, releaseId = ?, result = ? WHERE id = ?", [CATALOG_IMPORT_COMPLETED, releaseId, result, importId]),
  ];
}
