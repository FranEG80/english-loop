import { describe, expect, it, vi } from "vitest";

const daily = vi.hoisted(() => ({ submitDailyAttempt: vi.fn(), completeDailySession: vi.fn() }));
vi.mock("@/adapters/adapter-factory", () => ({ getDailySessionPort: () => daily }));

import { completeDailySessionAction, submitDailyAttemptAction } from "./actions";

describe("daily server actions", () => {
  it("delegates attempt submission and session completion", async () => {
    daily.submitDailyAttempt.mockResolvedValueOnce({ isCorrect: true });
    daily.completeDailySession.mockResolvedValueOnce({ id: "session-1", status: "completed" });
    await expect(submitDailyAttemptAction("session-1", { activityId: "activity-1", idempotencyKey: "session-1:0", response: { kind: "boolean", value: true } })).resolves.toEqual({ isCorrect: true });
    await expect(completeDailySessionAction("session-1")).resolves.toEqual({ id: "session-1", status: "completed" });
  });
});
