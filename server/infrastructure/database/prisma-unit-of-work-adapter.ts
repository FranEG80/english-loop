import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { UnitOfWorkPort } from "@/core/shared/kernel";
import {
  getCurrentPrismaTransaction,
  runInPrismaTransaction,
} from "./prisma-transaction-context";
import { isRetryablePrismaTransactionError } from "./prisma-transaction-retry";

/**
 * Adaptador de UnitOfWork sobre Prisma. Mantiene las transacciones cortas y
 * aísla Prisma del core.
 */
export class PrismaUnitOfWorkAdapter implements UnitOfWorkPort {
  constructor(
    private readonly client: PrismaClient,
    private readonly retryLimit: number,
  ) {}

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const currentTransaction = getCurrentPrismaTransaction();
    if (currentTransaction) return work();
    for (let retry = 0; ; retry += 1) {
      try {
        return await this.client.$transaction((tx) => runInPrismaTransaction(tx, work));
      } catch (error) {
        if (retry >= this.retryLimit || !isRetryablePrismaTransactionError(error)) {
          throw error;
        }
      }
    }
  }
}
