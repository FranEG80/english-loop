import { describe, expect, it } from "vitest";
import { dailySessionMockAdapter } from "./daily-session-mock-adapter";

describe("dailySessionMockAdapter", () => {
  it("creates an idempotent session, grades an attempt and transitions status", async () => {
    const session = await dailySessionMockAdapter.getTodaySession("Europe/Madrid");
    expect(await dailySessionMockAdapter.getTodaySession("Europe/Madrid")).toBe(session);
    const feedback = await dailySessionMockAdapter.submitDailyAttempt(session.id, { activityId: session.activityIds[0], idempotencyKey: `${session.id}:0`, response: { kind: "text", value: "went" } });
    expect(feedback.activityId).toBe(session.activityIds[0]);
    expect((await dailySessionMockAdapter.startDailyPractice(session.id)).status).toBe("practice");
    expect((await dailySessionMockAdapter.completeDailySession(session.id)).status).toBe("completed");
  });
});
