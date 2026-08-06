import { describe, expect, it, vi } from "vitest";

const focused = vi.hoisted(() => ({ createRun: vi.fn(), getScopeAvailability: vi.fn(), submitRunAttempt: vi.fn(), getRunSummary: vi.fn() }));
vi.mock("@/adapters/adapter-factory", () => ({ getFocusedPracticePort: () => focused }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));

import { createFocusedPracticeAction, getFocusedAvailabilityAction, getFocusedSummaryAction, submitFocusedAttemptAction } from "./actions";

describe("review server actions", () => {
  it("normalizes focused-practice form input and redirects with activity ids", async () => {
    focused.createRun.mockResolvedValueOnce({ id: "run-1", activityIds: ["a1", "a2"] });
    const form = new FormData(); form.set("taxonomyNodeId", "grammar"); form.set("level", "invalid"); form.set("sessionSize", "999");
    await expect(createFocusedPracticeAction({}, form)).rejects.toMatchObject({
      message: "REDIRECT:/review/session/run-1?activityId=a1&activityId=a2",
    });
    expect(focused.createRun).toHaveBeenCalledWith({ taxonomyNodeId: "grammar", level: "both", sessionSize: 5 });
  });

  it("delegates attempts and summaries", async () => {
    focused.submitRunAttempt.mockResolvedValueOnce({ isCorrect: false });
    focused.getRunSummary.mockResolvedValueOnce({ runId: "run-1" });
    await expect(submitFocusedAttemptAction("run-1", { activityId: "a1", idempotencyKey: "run-1:0", response: { kind: "text", value: "x" } })).resolves.toEqual({ isCorrect: false });
    await expect(getFocusedSummaryAction("run-1")).resolves.toEqual({ runId: "run-1" });
  });

  it("accepts every supported level and session size", async () => {
    for (const [level, size] of [["B1", 10], ["B2", 15], ["B2", 20]] as const) {
      focused.createRun.mockResolvedValueOnce({ id: `run-${size}`, activityIds: [] });
      const form = new FormData();
      form.set("taxonomyNodeId", "grammar");
      form.set("level", level);
      form.set("sessionSize", String(size));
      await expect(createFocusedPracticeAction({}, form)).rejects.toMatchObject({ message: `REDIRECT:/review/session/run-${size}?` });
    }
  });

  it("defaults missing form fields", async () => {
    focused.createRun.mockResolvedValueOnce({ id: "run-defaults", activityIds: [] });
    await expect(createFocusedPracticeAction({}, new FormData())).rejects.toMatchObject({ message: "REDIRECT:/review/session/run-defaults?" });
    expect(focused.createRun).toHaveBeenLastCalledWith({ taxonomyNodeId: "", level: "both", sessionSize: 5 });
  });

  it("returns an actionable form error instead of crashing the route", async () => {
    focused.createRun.mockRejectedValueOnce(
      new Error("There are not enough activities for this selection yet."),
    );

    await expect(
      createFocusedPracticeAction({}, new FormData()),
    ).resolves.toEqual({
      error: "There are not enough activities for this selection yet.",
    });
  });

  it("loads scope availability through the focused-practice port", async () => {
    focused.getScopeAvailability.mockResolvedValueOnce([
      { nodeId: "grammar", level: "both", availableActivityCount: 12 },
    ]);

    await expect(getFocusedAvailabilityAction("grammar")).resolves.toEqual([
      { nodeId: "grammar", level: "both", availableActivityCount: 12 },
    ]);
  });
});
