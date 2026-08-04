import type { D1DatabaseLike, D1PreparedStatement, D1Value } from "../types/binding";

export function statement(database: D1DatabaseLike, query: string, values: D1Value[] = []): D1PreparedStatement {
  return database.prepare(query).bind(...values);
}

export function chunk<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

export function generatedId(): string {
  return crypto.randomUUID();
}
