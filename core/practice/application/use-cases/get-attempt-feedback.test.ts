import { describe, expect, it } from "vitest";
import { activity, clock, actor } from "@/test/support/core-fakes";
import { ActivityAttempt } from "../../domain/activity-attempt";
import { getAttemptFeedback } from "./get-attempt-feedback";

describe("getAttemptFeedback", () => {
  it("returns the safe answer and explanation for an existing activity", async () => {
    const attempt = ActivityAttempt.create({ id: "attempt", userId: actor.userId, practiceRunId: null, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "key", response: { kind: "boolean", value: true }, isCorrect: true, evaluatorVersion: "1", submittedAt: clock.nowIso() });
    const catalog = { getActivityById: async () => activity("activity-1"), listActivities: async () => [], countActivitiesByNode: async () => 1, countActivitiesByNodes: async () => 1 };
    await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({ attemptId: "attempt", activityId: "activity-1", correctAnswer: "true", explanation: "Because" });
  });

  it("does not fail when the activity was removed from the catalog", async () => {
    const attempt = ActivityAttempt.create({ id: "attempt-missing", userId: actor.userId, practiceRunId: null, activityId: "missing", origin: "FOCUSED", idempotencyKey: "key", response: { kind: "text", value: "x" }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
    const catalog = { getActivityById: async () => null, listActivities: async () => [], countActivitiesByNode: async () => 0, countActivitiesByNodes: async () => 0 };
    await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({ correctAnswer: [], explanation: "" });
  });

  it("extracts every evaluator answer shape without exposing private fields", async () => {
    const values = [
      [{ strategy: "boolean", correct: false }, "false"],
      [{ strategy: "single_option", correctOptionId: "option-1" }, "option-1"],
      [{ strategy: "multiple_options", correctOptionIds: ["a", "b"] }, ["a", "b"]],
      [{ strategy: "exact_text", answer: "exact" }, "exact"],
      [{ strategy: "one_of_texts", answers: ["one", "two"] }, ["one", "two"]],
      [{ strategy: "ordered_tokens", correctTokenIds: ["1", "2"] }, ["1", "2"]],
      [{ strategy: "unordered_set", correctValues: ["x", "y"] }, ["x", "y"]],
    ] as const;
    for (const [evaluator, correctAnswer] of values) {
      const attempt = ActivityAttempt.create({ id: `attempt-${evaluator.strategy}`, userId: actor.userId, practiceRunId: null, activityId: "activity-evaluator", origin: "FOCUSED", idempotencyKey: `key-${evaluator.strategy}`, response: { kind: "text", value: "answer" }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
      const catalog = { getActivityById: async () => ({ ...activity("activity-evaluator"), evaluator: evaluator as never }), listActivities: async () => [], countActivitiesByNode: async () => 0, countActivitiesByNodes: async () => 0 };
      await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({ correctAnswer });
    }
  });
});
