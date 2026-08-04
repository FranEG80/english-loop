import { describe, expect, it } from "vitest";
import { first, bool, iso, nullableText, rows, text } from "./d1-row-mapper";
import { sessionRowsToDomain } from "./learning-mapper";
import { attemptFromRow, practiceRunRowsToDomain } from "./practice-mapper";
import { reviewFromRow } from "./progress-mapper";

const now = "2026-08-04T00:00:00.000Z";

describe("D1 row mappers", () => {
  it("normalizes scalar values and result collections", () => {
    const result = { success: true, results: [{ id: "one" }] };
    expect(rows(result)).toEqual([{ id: "one" }]);
    expect(first(result)).toEqual({ id: "one" });
    expect(first({ success: true, results: [] })).toBeNull();
    expect(bool(true)).toBe(true);
    expect(bool(1)).toBe(true);
    expect(bool("1")).toBe(true);
    expect(bool(false)).toBe(false);
    expect(text(null)).toBe("");
    expect(nullableText(undefined)).toBeNull();
    expect(nullableText("value")).toBe("value");
    expect(iso(now)).toBe(now);
    expect(iso("not-a-date")).toBe("not-a-date");
  });

  it("maps aggregate rows and nullable fields", () => {
    expect(sessionRowsToDomain([])).toBeNull();
    const session = sessionRowsToDomain([{ id: "s1", userId: "u1", date: "2026-08-04", status: "lesson", datasetVersion: "v1", seed: "seed", practiceRunId: null, createdAt: now, lessonId: null }]);
    expect(session?.lessons).toEqual([]);
    expect(practiceRunRowsToDomain([])).toBeNull();
    const run = practiceRunRowsToDomain([{ id: "r1", userId: "u1", mode: "FOCUSED", status: "in_progress", scopeSnapshot: JSON.stringify({ level: "B1", taxonomyNodeId: "n1", taxonomyPath: [], descendantIds: ["n1"], requestedCount: 1 }), currentIndex: 0, originalActivityCount: 1, datasetVersion: "v1", createdAt: now, position: 0, activityId: "a1", isRepetition: 0 }]);
    expect(run?.activityIds).toEqual(["a1"]);
    const attempt = attemptFromRow({ id: "at1", userId: "u1", practiceRunId: null, activityId: "a1", activityVersionId: null, practiceRunItemId: null, origin: "FOCUSED", idempotencyKey: "key", response: JSON.stringify({ kind: "boolean", value: true }), isCorrect: 1, isRepetition: 0, evaluatorVersion: "v1", submittedAt: now });
    expect(attempt.response).toEqual({ kind: "boolean", value: true });
    const review = reviewFromRow({ id: "rv1", userId: "u1", activityId: "a1", activityVersionId: null, lessonId: null, taxonomyNodeId: "n1", level: "B1", stage: 0, consecutiveCorrect: 0, dueAt: now, failedAt: now, resolvedAt: null, attemptsCount: 1 });
    expect(review.resolvedAt).toBeNull();
  });
});
