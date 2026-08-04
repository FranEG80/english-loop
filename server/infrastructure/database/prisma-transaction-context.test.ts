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
    const unitOfWork = new PrismaUnitOfWorkAdapter(client, 0);
    const result = await unitOfWork.transaction(async () => {
      return unitOfWork.transaction(async () => "committed");
    });
    expect(result).toBe("committed");
    expect(transactions).toBe(1);
  });

  it("retries only retryable transaction conflicts up to the configured limit", async () => {
    let transactions = 0;
    const transactionClient = { name: "tx" } as never;
    const client = {
      $transaction: async (work: (tx: typeof transactionClient) => Promise<string>) => {
        transactions += 1;
        if (transactions < 3) throw Object.assign(new Error("serialization conflict"), { code: "P2034" });
        return work(transactionClient);
      },
    } as never;
    const unitOfWork = new PrismaUnitOfWorkAdapter(client, 2);

    await expect(unitOfWork.transaction(async () => "committed")).resolves.toBe("committed");
    expect(transactions).toBe(3);
  });

  it("does not retry non-serialization errors or exceed the limit", async () => {
    let transactions = 0;
    const client = {
      $transaction: async () => {
        transactions += 1;
        throw Object.assign(new Error("constraint conflict"), { code: "P2002" });
      },
    } as never;
    const unitOfWork = new PrismaUnitOfWorkAdapter(client, 2);

    await expect(unitOfWork.transaction(async () => "never")).rejects.toMatchObject({ code: "P2002" });
    expect(transactions).toBe(1);

    transactions = 0;
    const retryingClient = {
      $transaction: async () => {
        transactions += 1;
        throw Object.assign(new Error("serialization conflict"), { code: "P2034" });
      },
    } as never;
    const limitedUnitOfWork = new PrismaUnitOfWorkAdapter(retryingClient, 2);
    await expect(limitedUnitOfWork.transaction(async () => "never")).rejects.toMatchObject({ code: "P2034" });
    expect(transactions).toBe(3);
  });
});
