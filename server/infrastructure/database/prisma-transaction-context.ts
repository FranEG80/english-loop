import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";

export type PrismaTransactionClient = Prisma.TransactionClient;
export type PrismaDbClient = PrismaClient | PrismaTransactionClient;

const transactionStorage = new AsyncLocalStorage<PrismaTransactionClient>();

export function runInPrismaTransaction<T>(
  client: PrismaTransactionClient,
  work: () => Promise<T>,
): Promise<T> {
  return transactionStorage.run(client, work);
}

export function getPrismaClient(rootClient: PrismaClient): PrismaDbClient {
  return transactionStorage.getStore() ?? rootClient;
}

export function getCurrentPrismaTransaction(): PrismaTransactionClient | undefined {
  return transactionStorage.getStore();
}
