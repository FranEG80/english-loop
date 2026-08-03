// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PrismaUnitOfWorkAdapter } from "./prisma-unit-of-work-adapter";
import { getCurrentPrismaTransaction, getPrismaClient, runInPrismaTransaction } from "./prisma-transaction-context";

describe("Prisma transaction context", () => {
  it("exposes the transaction client to repositories and falls back to root", async () => {
    const root = { name: "root" } as never;
    const tx = { name: "tx" } as never;
    expect(getPrismaClient(root)).toBe(root);
    await runInPrismaTransaction(tx, async () => {
      expect(getPrismaClient(root)).toBe(tx);
      expect(getCurrentPrismaTransaction()).toBe(tx);
    });
    expect(getCurrentPrismaTransaction()).toBeUndefined();
  });

  it("opens one transaction and reuses it for nested units of work", async () => {
    let transactions = 0;
    const transactionClient = { name: "tx" } as never;
    const client = {
      $transaction: async (work: (tx: typeof transactionClient) => Promise<string>) => {
        transactions += 1;
        return work(transactionClient);
      },
    } as never;
    const unitOfWork = new PrismaUnitOfWorkAdapter(client);
    const result = await unitOfWork.transaction(async () => {
      return unitOfWork.transaction(async () => "committed");
    });
    expect(result).toBe("committed");
    expect(transactions).toBe(1);
  });
});
