import type { D1DatabaseLike, D1PreparedStatement, D1Result, D1Value } from "./d1-types";

export const d1OperationNames = [
  "health",
  "activeCatalogMetadata",
  "activityById",
  "consumeVerification",
] as const;

export type D1OperationName = (typeof d1OperationNames)[number];

export type D1Operation =
  | { name: "health" }
  | { name: "activeCatalogMetadata" }
  | { name: "activityById"; activityId: string }
  | { name: "consumeVerification"; identifier: string; value: string; nowIso: string };

interface PreparedOperation {
  statement: D1PreparedStatement;
  write: boolean;
}

/**
 * The only SQL known by the D1 transport. Callers select an operation name;
 * they never send SQL or identifiers over HTTP.
 */
export function prepareD1Operation(
  database: D1DatabaseLike,
  operation: D1Operation,
): PreparedOperation {
  switch (operation.name) {
    case "health":
      return {
        statement: database.prepare("SELECT 1 AS ok"),
        write: false,
      };
    case "activeCatalogMetadata":
      return {
        statement: database.prepare(
          `SELECT r.datasetVersion, r.checksum
             FROM CatalogPublication p
             JOIN CatalogRelease r ON r.id = p.releaseId
            WHERE p.id = 'active' AND r.status = 'published'`,
        ),
        write: false,
      };
    case "activityById":
      return {
        statement: database
          .prepare(
            `SELECT v.activityId, v.id AS activityVersionId, v.levelCode,
                    v.activityTypeCode, v.category, v.topic, v.subtopic,
                    v.difficulty, v.instructions, v.prompt, v.passage,
                    v.explanation, v.tags, v.lessonIds, v.estimatedSeconds,
                    v.evaluatorData, v.statusCode
               FROM ActivityVersion v
               JOIN CatalogPublication p ON p.releaseId = v.releaseId
              WHERE p.id = 'active' AND v.statusCode = 'published'
                AND v.activityId = ?
              ORDER BY v.id DESC
              LIMIT 1`,
          )
          .bind(operation.activityId),
        write: false,
      };
    case "consumeVerification":
      return {
        statement: database
          .prepare(
            `DELETE FROM Verification
              WHERE identifier = ? AND value = ? AND expiresAt > ?`,
          )
          .bind(operation.identifier, operation.value, operation.nowIso),
        write: true,
      };
  }
}

export class D1BindingClient {
  constructor(private readonly database: D1DatabaseLike) {}

  async execute(operation: D1Operation): Promise<D1Result> {
    const prepared = prepareD1Operation(this.database, operation);
    if (prepared.write) return prepared.statement.run();
    return prepared.statement.all();
  }

  /** D1's native batch is the write boundary for operations that must share a request. */
  async batch(operations: D1Operation[]): Promise<D1Result[]> {
    if (operations.length === 0) return [];
    const prepared = operations.map((operation) =>
      prepareD1Operation(this.database, operation),
    );
    return this.database.batch(prepared.map(({ statement }) => statement));
  }

  async health(): Promise<boolean> {
    const result = await this.execute({ name: "health" });
    return result.success && result.results[0]?.["ok"] === 1;
  }

  async consumeVerification(
    identifier: string,
    value: string,
    nowIso: string,
  ): Promise<boolean> {
    const result = await this.execute({
      name: "consumeVerification",
      identifier,
      value,
      nowIso,
    });
    return result.success && (result.meta?.changes ?? 0) === 1;
  }
}

export function d1Value(value: unknown): D1Value {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof ArrayBuffer ||
    value instanceof Uint8Array
  ) {
    return value;
  }
  throw new TypeError("D1 parameters must be scalar values");
}
