import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { D1Result } from "./types/binding";
import type { D1Operation } from "./types/operations";
import type { D1TransportClient } from "./types/transport";

interface TransactionScope {
  writes: D1Operation[];
}

const WRITE_OPERATIONS = new Set<D1Operation["name"]>([
  "userSettingsSave", "savedLessonSave", "savedLessonDelete", "dailySessionSave", "practiceRunSave",
  "attemptSave", "lessonProgressSave", "activityProgressSave", "taxonomyProgressSave", "reviewSave",
  "rateLimitConsume", "authCreate", "authUpdate", "authUpdateMany", "authDelete", "authDeleteMany",
  "authConsumeOne", "authIncrementOne", "consumeVerification", "acceptReplayNonce",
]);

/**
 * Request-local D1 transaction coordinator. D1 has no long-lived SQL
 * transaction handle; its atomic primitive is one native `batch()` call.
 * Reads run against D1 immediately and writes are committed together when
 * the application callback completes successfully.
 */
export class D1TransactionCoordinator implements D1TransportClient {
  private readonly scopes = new AsyncLocalStorage<TransactionScope>();

  constructor(private readonly transport: D1TransportClient) {}

  async execute(operation: D1Operation): Promise<D1Result> {
    const scope = this.scopes.getStore();
    if (scope && WRITE_OPERATIONS.has(operation.name)) {
      scope.writes.push(operation);
      return { success: true, results: [], meta: { changes: 1 } };
    }
    return this.transport.execute(operation);
  }

  async batch(operations: D1Operation[]): Promise<D1Result[]> {
    const scope = this.scopes.getStore();
    if (!scope) return this.transport.batch(operations);
    const writes = operations.filter((operation) => WRITE_OPERATIONS.has(operation.name));
    const reads = operations.filter((operation) => !WRITE_OPERATIONS.has(operation.name));
    scope.writes.push(...writes);
    if (reads.length === 0) return writes.map(() => ({ success: true, results: [], meta: { changes: 1 } }));
    return this.transport.batch(reads);
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const current = this.scopes.getStore();
    if (current) return work();
    return this.scopes.run({ writes: [] }, async () => {
      const result = await work();
      const scope = this.scopes.getStore();
      if (!scope || scope.writes.length === 0) return result;
      const committed = await this.transport.batch(scope.writes);
      if (!committed.every((item) => item.success)) throw new Error("D1 transaction batch failed");
      return result;
    });
  }
}
