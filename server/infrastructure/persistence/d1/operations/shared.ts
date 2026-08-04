import type { D1DatabaseLike, D1PreparedStatement, D1Value } from "../types/binding";

export interface PreparedOperation {
  statement: D1PreparedStatement;
  write: boolean;
}

export function bind(
  database: D1DatabaseLike,
  query: string,
  values: D1Value[],
  write = false,
): PreparedOperation {
  return { statement: database.prepare(query).bind(...values), write };
}
