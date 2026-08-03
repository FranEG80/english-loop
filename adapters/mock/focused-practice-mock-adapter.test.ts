import { describe, expect, it } from "vitest";
import { focusedPracticeMockAdapter } from "./focused-practice-mock-adapter";

describe("focusedPracticeMockAdapter", () => {
  it("reports scope availability and advances a run into its summary", async () => {
    const availability = await focusedPracticeMockAdapter.getScopeAvailability("grammar.conditionals");
    expect(availability).toHaveLength(3);
    const run = await focusedPracticeMockAdapter.createRun({ taxonomyNodeId: "grammar.conditionals", level: "B1", sessionSize: 5 });
    await focusedPracticeMockAdapter.submitRunAttempt(run.id, { activityId: run.activityIds[0], response: { kind: "text", value: "wrong" } });
    expect(await focusedPracticeMockAdapter.getRunSummary(run.id)).toMatchObject({ runId: run.id, incorrectCount: 1 });
  });
});
