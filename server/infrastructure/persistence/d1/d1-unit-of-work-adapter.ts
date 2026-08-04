import "server-only";
import type { UnitOfWorkPort } from "@/core/shared/kernel";

/**
 * D1's transactional primitive is `D1Database.batch()`. Repository writes
 * that are intrinsically composite use that primitive directly. The generic
 * core port remains available for read/modify/write use cases while the
 * request-scoped batch coordinator is introduced in the next persistence
 * slice.
 */
export class D1UnitOfWorkAdapter implements UnitOfWorkPort {
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }
}
