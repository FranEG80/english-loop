import { describe, expect, it } from "vitest";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { InvariantViolationException } from "@/core/shared/exceptions";

function makeRun(overrides: Partial<Parameters<typeof PracticeRun.create>[0]> = {}) {
  return PracticeRun.create({
    id: "run-1",
    userId: "u1",
    mode: "FOCUSED",
    scope: {
      level: "B1",
      taxonomyNodeId: "grammar",
      taxonomyPath: [],
      descendantIds: ["grammar"],
      requestedCount: 2,
    },
    activityIds: ["a1", "a2"],
    currentIndex: 0,
    status: "in_progress",
    datasetVersion: "0.1.0",
    dailySessionId: null,
    createdAt: "2026-08-03T00:00:00.000Z",
    ...overrides,
  });
}

describe("PracticeRun", () => {
  it("requires at least one activity", () => {
    expect(() => makeRun({ activityIds: [] })).toThrow(
      InvariantViolationException,
    );
  });

  it("returns the current activity", () => {
    const run = makeRun();
    expect(run.currentActivityId).toBe("a1");
  });

  it("advances through activities and completes", () => {
    const run = makeRun();
    expect(run.advance()).toBe(false);
    expect(run.currentIndex).toBe(1);
    expect(run.currentActivityId).toBe("a2");
    expect(run.advance()).toBe(true);
    expect(run.status).toBe("completed");
    expect(run.currentActivityId).toBeNull();
  });

  it("cannot advance a completed run", () => {
    const run = makeRun({ status: "completed", currentIndex: 2 });
    expect(() => run.advance()).toThrow(InvariantViolationException);
  });
});
