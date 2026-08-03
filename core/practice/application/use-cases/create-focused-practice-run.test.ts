import { describe, expect, it, vi } from "vitest";
import { activity, clock, identity, ids, MemoryRuns, taxonomy } from "@/test/support/core-fakes";
import { createFocusedPracticeRun } from "./create-focused-practice-run";

describe("createFocusedPracticeRun", () => {
  it("resolves the scope, delegates planning and persists a focused run", async () => {
    const repository = new MemoryRuns();
    const planner = { plan: vi.fn(async () => ({ activityIds: ["activity-1"], coveredSubtopicIds: ["topic"] })) };
    const catalog = { listActivities: async () => [activity("activity-1")], getActivityById: async () => activity("activity-1"), countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    const result = await createFocusedPracticeRun(identity, repository, catalog, taxonomy, planner as never, ids, clock, "v1", { taxonomyNodeId: "topic", level: "B1", sessionSize: 5 });
    expect(result.run.mode).toBe("FOCUSED");
    expect(result.run.activityIds).toEqual(["activity-1"]);
    expect(result.coveredSubtopicIds).toEqual(["topic"]);
    expect(planner.plan).toHaveBeenCalledOnce();
  });
});
