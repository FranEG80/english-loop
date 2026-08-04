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

  it("handles both levels, unknown scopes, missing runs and empty summaries", async () => {
    const availability = await focusedPracticeMockAdapter.getScopeAvailability("unknown.scope");
    expect(availability.every((item) => item.availableActivityCount === 0 && !item.isEligible)).toBe(true);
    const run = await focusedPracticeMockAdapter.createRun({ taxonomyNodeId: "unknown.scope", level: "both", sessionSize: 3 });
    expect(run.activityIds).toEqual([]);
    await expect(focusedPracticeMockAdapter.getRunSummary(run.id)).resolves.toMatchObject({ scorePercent: 0, coveredSubtopicIds: [] });
    await expect(focusedPracticeMockAdapter.submitRunAttempt("missing-run", { activityId: "x", response: { kind: "text", value: "x" } })).rejects.toMatchObject({ message: expect.stringContaining("No existe la sesión") });
    await expect(focusedPracticeMockAdapter.submitRunAttempt(run.id, { activityId: "missing-activity", response: { kind: "text", value: "x" } })).rejects.toMatchObject({ message: expect.stringContaining("No existe la actividad") });
  });
});
