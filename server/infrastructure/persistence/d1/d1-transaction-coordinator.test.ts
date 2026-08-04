import { describe, expect, it } from "vitest";
import { D1TransactionCoordinator } from "./d1-transaction-coordinator";
import type { D1Operation } from "./types/operations";

function transport() {
  const executed: D1Operation[] = [];
  const batches: D1Operation[][] = [];
  return {
    executed,
    batches,
    execute: async (operation: D1Operation) => {
      executed.push(operation);
      return { success: true, results: [{ ok: 1 }] };
    },
    batch: async (operations: D1Operation[]) => {
      batches.push(operations);
      return operations.map(() => ({ success: true, results: [], meta: { changes: 1 } }));
    },
  };
}

describe("D1TransactionCoordinator", () => {
  it("executes reads immediately and commits writes as one native batch", async () => {
    const base = transport();
    const coordinator = new D1TransactionCoordinator(base);

    await coordinator.transaction(async () => {
      await coordinator.execute({ name: "health" });
      await coordinator.execute({ name: "savedLessonDelete", userId: "u1", lessonId: "l1" });
      await coordinator.execute({ name: "reviewSave", snapshot: {
        id: "r1", userId: "u1", activityId: "a1", activityVersionId: null, lessonId: null,
        taxonomyNodeId: "t1", level: "B1", stage: 0, consecutiveCorrect: 0,
        dueAt: "2026-01-01T00:00:00.000Z", failedAt: "2026-01-01T00:00:00.000Z", resolvedAt: null, attemptsCount: 1,
      } });
    });

    expect(base.executed.map((operation) => operation.name)).toEqual(["health"]);
    expect(base.batches).toHaveLength(1);
    expect(base.batches[0]?.map((operation) => operation.name)).toEqual(["savedLessonDelete", "reviewSave"]);
  });

  it("discards queued writes when the application callback fails", async () => {
    const base = transport();
    const coordinator = new D1TransactionCoordinator(base);

    const promise = coordinator.transaction(async () => {
      await coordinator.execute({ name: "savedLessonDelete", userId: "u1", lessonId: "l1" });
      throw new Error("business rule failed");
    });

    await expect(promise).rejects.toMatchObject({ message: "business rule failed" });
    expect(base.batches).toHaveLength(0);
  });
});
