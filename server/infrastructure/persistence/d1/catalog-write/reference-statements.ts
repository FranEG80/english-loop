import type { CatalogSeedActivity } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike, D1PreparedStatement } from "../types/binding";
import { statement } from "./shared";

export function referenceStatements(database: D1DatabaseLike, input: { activities: CatalogSeedActivity[]; levels: string[]; statuses: string[] }): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = [];
  for (const code of new Set(input.activities.map((activity) => activity.type))) statements.push(statement(database, "INSERT INTO ActivityType (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code]));
  for (const code of new Set(input.activities.map((activity) => activity.evaluatorStrategy))) statements.push(statement(database, "INSERT INTO EvaluatorStrategy (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code]));
  for (const code of input.levels) statements.push(statement(database, "INSERT INTO CefrLevel (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code]));
  for (const code of input.statuses) statements.push(statement(database, "INSERT INTO EditorialStatus (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code]));
  return statements;
}
