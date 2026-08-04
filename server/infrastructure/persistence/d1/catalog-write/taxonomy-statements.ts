import type { CatalogSeedTaxonomyNode } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { generatedId, statement } from "./shared";

export function taxonomyStatements(database: D1DatabaseLike, releaseId: string, nodes: CatalogSeedTaxonomyNode[]): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const node of nodes) {
    statements.push(statement(database, "INSERT INTO TaxonomyNode (id) VALUES (?) ON CONFLICT(id) DO NOTHING", [node.id]));
    statements.push(statement(database, `INSERT INTO TaxonomyNodeVersion
      (id, releaseId, nodeId, checksum, parentId, kind, labelsEn, labelsEs, levels, selectableForPractice, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [generatedId(), releaseId, node.id, node.checksum, node.parentId, node.kind,
      node.labels.en, node.labels.es, JSON.stringify(node.levels), node.selectableForPractice ? 1 : 0, node.order]));
  }
  return statements;
}
