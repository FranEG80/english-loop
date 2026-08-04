import "server-only";
import type { UnitOfWorkPort } from "@/core/shared/kernel";
import type { D1TransactionCoordinator } from "./d1-transaction-coordinator";

/**
 * D1's transactional primitive is `D1Database.batch()`, coordinated through
 * a request-local transport scope.
 */
export class D1UnitOfWorkAdapter implements UnitOfWorkPort {
  constructor(private readonly coordinator: D1TransactionCoordinator) {}

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return this.coordinator.transaction(work);
  }
}
