import type { D1DatabaseLike, D1Result } from "./types/binding";
import type { D1Operation } from "./types/operations";
import { prepareD1Operation, prepareCompositeD1Operation } from "./operations";

export * from "./types/operations";
export * from "./operations/validation";

export class D1BindingClient {
  constructor(private readonly database: D1DatabaseLike) {}

  async execute(operation: D1Operation): Promise<D1Result> {
    const prepared = operation.name === "dailySessionSave" || operation.name === "practiceRunSave"
      ? prepareCompositeD1Operation(this.database, operation)
      : [prepareD1Operation(this.database, operation)];
    if (prepared.length > 1) {
      const results = await this.database.batch(prepared.map(({ statement }) => statement));
      return {
        success: results.every((result) => result.success),
        results: [],
        meta: { changes: results.reduce((total, result) => total + (result.meta?.changes ?? 0), 0) },
      };
    }
    const [single] = prepared;
    if (!single) throw new Error("D1 operation produced no statement");
    if (single.write) return single.statement.run();
    return single.statement.all();
  }

  /** D1's native batch is the write boundary for operations that must share a request. */
  async batch(operations: D1Operation[]): Promise<D1Result[]> {
    if (operations.length === 0) return [];
    const prepared = operations.flatMap((operation) =>
      operation.name === "dailySessionSave" || operation.name === "practiceRunSave"
        ? prepareCompositeD1Operation(this.database, operation)
        : [prepareD1Operation(this.database, operation)],
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

  async acceptReplayNonce(nonce: string, nowIso: string, expiresAtIso: string): Promise<boolean> {
    const result = await this.execute({ name: "acceptReplayNonce", nonce, nowIso, expiresAtIso });
    return result.success && (result.meta?.changes ?? 0) === 1;
  }
}



export { prepareD1Operation, prepareCompositeD1Operation };
