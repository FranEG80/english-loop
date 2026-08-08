import { describe, expect, it } from "vitest";
import { activity, clock, actor } from "@/test/support/core-fakes";
import { ActivityAttempt } from "../../domain/activity-attempt";
import { ReviewItem } from "@/core/progress/domain/review-item";
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

  it("uses the version stored on the immutable attempt for feedback", async () => {
    const attempt = ActivityAttempt.create({ id: "attempt-versioned", userId: actor.userId, practiceRunId: null, activityId: "activity-1", activityVersionId: "activity-1-v1", origin: "FOCUSED", idempotencyKey: "key-versioned", response: { kind: "boolean", value: true }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
    const catalog = {
      getActivityById: async () => ({ ...activity("activity-1"), explanation: "Active explanation", evaluator: { strategy: "boolean" as const, correct: true } }),
      getActivityByVersionId: async () => ({ ...activity("activity-1"), versionId: "activity-1-v1", explanation: "Pinned explanation", evaluator: { strategy: "boolean" as const, correct: false } }),
      listActivities: async () => [],
      countActivitiesByNode: async () => 0,
      countActivitiesByNodes: async () => 0,
    };
    await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({ correctAnswer: "false", explanation: "Pinned explanation" });
  });

  it("falls back to the activity id when the pinned version is not in the current catalog", async () => {
    const attempt = ActivityAttempt.create({ id: "attempt-version-missing", userId: actor.userId, practiceRunId: null, activityId: "activity-1", activityVersionId: "database-version", origin: "FOCUSED", idempotencyKey: "key-version-missing", response: { kind: "boolean", value: true }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
    const catalog = {
      getActivityById: async () => ({ ...activity("activity-1"), explanation: "Current explanation", evaluator: { strategy: "boolean" as const, correct: true } }),
      getActivityByVersionId: async () => null,
      listActivities: async () => [],
      countActivitiesByNode: async () => 0,
      countActivitiesByNodes: async () => 0,
    };

    await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({
      correctAnswer: "true",
      explanation: "Current explanation",
    });
  });

  it("returns the normalized response and the next review date", async () => {
    const attempt = ActivityAttempt.create({ id: "attempt-review", userId: actor.userId, practiceRunId: null, activityId: "activity-1", origin: "FOCUSED", idempotencyKey: "key-review", response: { kind: "text", value: "  YES.  " }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
    const catalog = {
      getActivityById: async () => ({ ...activity("activity-1"), evaluator: { strategy: "exact_text" as const, answer: "yes", normalization: { trim: true, collapseWhitespace: true, caseSensitive: false, ignoreTerminalPunctuation: true, normaliseApostrophes: true } } }),
      listActivities: async () => [],
      countActivitiesByNode: async () => 0,
      countActivitiesByNodes: async () => 0,
    };
    const review = ReviewItem.create({ id: "review", userId: actor.userId, activityId: "activity-1", taxonomyNodeId: "topic", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: "2026-08-05T00:00:00.000Z", failedAt: clock.nowIso(), resolvedAt: null, attemptsCount: 1 });
    const reviewRepository = { findByUserIdAndActivity: async () => review, findDueByUserId: async () => [], findUpcomingByUserId: async () => [], save: async () => undefined };

    await expect(getAttemptFeedback(catalog, attempt, reviewRepository)).resolves.toMatchObject({
      normalizedResponse: { kind: "text", value: "yes" },
      nextReviewAt: review.dueAt,
    });
  });

  it("extracts every evaluator answer shape without exposing private fields", async () => {
    const values = [
      [{ strategy: "boolean", correct: false }, "false"],
      [{ strategy: "single_option", correctOptionId: "option-1" }, "option-1"],
      [{ strategy: "multiple_options", correctOptionIds: ["a", "b"] }, ["a", "b"]],
      [{ strategy: "exact_text", answer: "exact" }, "exact"],
      [{ strategy: "one_of_texts", answers: ["one", "two"] }, ["one", "two"]],
      [{ strategy: "ordered_tokens", correctTokenIds: ["1", "2"] }, "1 2"],
      [
        { strategy: "per_gap", gaps: [{ gapId: "gap1", answers: ["one", "uno"] }] },
        ["one"],
      ],
      [
        { strategy: "matching_pairs", pairs: [{ leftId: "l1", rightId: "r1" }] },
        ["l1 · r1"],
      ],
      // Mazo y minijuego no caben en una línea: se explican ronda a ronda.
      [{ strategy: "deck_booleans", cards: [{ cardId: "c1", correct: true }] }, []],
      [
        { strategy: "game_rounds", rounds: [{ roundId: "r1", correctOptionId: "a" }] },
        [],
      ],
    ] as const;
    for (const [evaluator, correctAnswer] of values) {
      const attempt = ActivityAttempt.create({ id: `attempt-${evaluator.strategy}`, userId: actor.userId, practiceRunId: null, activityId: "activity-evaluator", origin: "FOCUSED", idempotencyKey: `key-${evaluator.strategy}`, response: { kind: "text", value: "answer" }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
      const catalog = { getActivityById: async () => ({ ...activity("activity-evaluator"), evaluator: evaluator as never }), listActivities: async () => [], countActivitiesByNode: async () => 0, countActivitiesByNodes: async () => 0 };
      await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({ correctAnswer });
    }
  });

  // Regresión: la corrección mostraba «Respuesta correcta: a», el id interno de
  // la opción, en vez del texto que el alumno acaba de leer en pantalla.
  it("resuelve los ids de opción, token y par al texto que ve el alumno", async () => {
    const cases = [
      {
        name: "single_option",
        overrides: {
          options: [
            { id: "a", text: "can" },
            { id: "b", text: "cans" },
          ],
          evaluator: { strategy: "single_option" as const, correctOptionId: "a" },
        },
        correctAnswer: "can",
      },
      {
        name: "ordered_tokens",
        overrides: {
          tokens: [
            { id: "t1", text: "She" },
            { id: "t2", text: "never" },
            { id: "t3", text: "lies" },
          ],
          evaluator: {
            strategy: "ordered_tokens" as const,
            correctTokenIds: ["t1", "t2", "t3"],
          },
        },
        correctAnswer: "She never lies",
      },
      {
        name: "matching_pairs",
        overrides: {
          pairs: [{ leftId: "l1", left: "give up", rightId: "r1", right: "dejar" }],
          evaluator: {
            strategy: "matching_pairs" as const,
            pairs: [{ leftId: "l1", rightId: "r1" }],
          },
        },
        correctAnswer: ["give up · dejar"],
      },
    ];

    for (const { name, overrides, correctAnswer } of cases) {
      const attempt = ActivityAttempt.create({ id: `attempt-label-${name}`, userId: actor.userId, practiceRunId: null, activityId: "activity-label", origin: "FOCUSED", idempotencyKey: `key-label-${name}`, response: { kind: "text", value: "answer" }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
      const catalog = { getActivityById: async () => ({ ...activity("activity-label"), ...overrides } as never), listActivities: async () => [], countActivitiesByNode: async () => 0, countActivitiesByNodes: async () => 0 };

      await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({
        correctAnswer,
      });
    }
  });

  it("no revienta con un intento de una estrategia retirada", async () => {
    const attempt = ActivityAttempt.create({ id: "attempt-legacy", userId: actor.userId, practiceRunId: null, activityId: "activity-evaluator", origin: "FOCUSED", idempotencyKey: "key-legacy", response: { kind: "text", value: "answer" }, isCorrect: false, evaluatorVersion: "1", submittedAt: clock.nowIso() });
    const catalog = { getActivityById: async () => ({ ...activity("activity-evaluator"), evaluator: { strategy: "unordered_set", correctValues: ["x"] } as never }), listActivities: async () => [], countActivitiesByNode: async () => 0, countActivitiesByNodes: async () => 0 };

    await expect(getAttemptFeedback(catalog, attempt)).resolves.toMatchObject({
      isCorrect: false,
      score: 0,
      items: [],
    });
  });
});
