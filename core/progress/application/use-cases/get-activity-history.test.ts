import { describe, expect, it } from "vitest";
import { actor, clock, identity, MemoryAttempts } from "@/test/support/core-fakes";
import { ActivityAttempt } from "@/core/practice/domain/activity-attempt";
import { getActivityHistory } from "./get-activity-history";

describe("getActivityHistory", () => {
  it("maps the immutable attempt audit trail", async () => {
    const attempts = new MemoryAttempts();
    await attempts.save(ActivityAttempt.create({ id: "attempt", userId: actor.userId, practiceRunId: null, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "key", response: { kind: "boolean", value: true }, isCorrect: true, evaluatorVersion: "1", submittedAt: clock.nowIso() }));
    await expect(getActivityHistory(identity, attempts, "activity-1")).resolves.toEqual({ activityId: "activity-1", attempts: [{ id: "attempt", isCorrect: true, submittedAt: clock.nowIso(), origin: "FOCUSED" }] });
  });
});
