import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { UnitOfWorkPort } from "@/core/shared/kernel";
import {
  getCurrentPrismaTransaction,
  runInPrismaTransaction,
} from "./prisma-transaction-context";

/**
 * Adaptador de UnitOfWork sobre Prisma. Mantiene las transacciones cortas y
 * aísla Prisma del core.
 */
export class PrismaUnitOfWorkAdapter implements UnitOfWorkPort {
  constructor(private readonly client: PrismaClient) {}

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const currentTransaction = getCurrentPrismaTransaction();
    if (currentTransaction) return work();
    return this.client.$transaction((tx) => runInPrismaTransaction(tx, work));
  }
}
