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

  it("keeps the version aligned with each activity, including repetitions", () => {
    const run = makeRun({ activityVersionIds: ["a1-v1", "a2-v1"] });
    expect(run.currentActivityVersionId).toBe("a1-v1");
    expect(run.scheduleRepetition("a1", "a1-v1")).toBe(true);
    expect(run.activityVersionIds).toEqual(["a1-v1", "a2-v1", "a1-v1"]);
    run.advance();
    expect(run.currentActivityVersionId).toBe("a2-v1");
    const snapshot = run.toSnapshot();
    snapshot.activityVersionIds?.push("mutated");
    expect(run.activityVersionIds).toEqual(["a1-v1", "a2-v1", "a1-v1"]);
  });

  it("rejects a snapshot whose versions do not match its activities", () => {
    expect(() => makeRun({ activityVersionIds: ["a1-v1"] })).toThrow(InvariantViolationException);
  });

  it("advances through activities and completes", () => {
    const run = makeRun();
    expect(run.advance()).toBe(false);
    expect(run.currentIndex).toBe(1);
    expect(run.currentActivityId).toBe("a2");
    expect(run.advance()).toBe(true);
    expect(run.status).toBe("completed");
    expect(run.currentActivityId).toBeNull();
    expect(run.currentActivityVersionId).toBeNull();
  });

  it("cannot advance a completed run", () => {
    const run = makeRun({ status: "completed", currentIndex: 2 });
    expect(() => run.advance()).toThrow(InvariantViolationException);
  });

  it("adds only one immediate repetition and never chains repetitions", () => {
    const run = makeRun({ activityIds: ["a1"], originalActivityCount: 1 });

    expect(run.scheduleRepetition("a1")).toBe(true);
    expect(run.scheduleRepetition("a1")).toBe(false);
    expect(run.activityIds).toEqual(["a1", "a1"]);
    expect(run.originalActivityCount).toBe(1);

    run.advance();
    expect(run.isCurrentActivityRepetition).toBe(true);
    expect(run.scheduleRepetition("a1")).toBe(false);
  });

  it("validates both index bounds and keeps snapshots isolated", () => {
    expect(() => makeRun({ currentIndex: -1 })).toThrow(InvariantViolationException);
    expect(() => makeRun({ currentIndex: 3 })).toThrow(InvariantViolationException);
    const run = makeRun({ currentIndex: 2 });
    expect(run.currentActivityId).toBeNull();
    const snapshot = run.toSnapshot();
    snapshot.activityIds.push("mutated");
    snapshot.scope.descendantIds.push("mutated");
    expect(run.activityIds).toEqual(["a1", "a2"]);
    expect(run.scope.descendantIds).toEqual(["grammar"]);
  });
});
