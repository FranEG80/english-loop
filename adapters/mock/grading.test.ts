import { describe, expect, it } from "vitest";
import { gradeMockAttempt } from "./grading";
import { mockActivities } from "./data/activities";

function activity(id: string) {
  const value = mockActivities.find((item) => item.id === id);
  if (!value) throw new Error(`Fixture not found: ${id}`);
  return value;
}

describe("mock grader", () => {
  it("grades boolean lists, single and multiple choices", () => {
    expect(gradeMockAttempt(activity("activity-true-false-present-simple"), {
      kind: "boolean_list",
      value: [false, true, false, true],
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-single-choice-future-forms"), {
      kind: "single",
      value: "opt-going-to",
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-multiple-choice-travel-vocabulary"), {
      kind: "multiple",
      value: ["opt-luggage", "opt-boarding-pass"],
    }).isCorrect).toBe(true);
  });

  it("grades text, ordered lists and pairs, and rejects a wrong response", () => {
    expect(gradeMockAttempt(activity("activity-fill-blank-past-simple"), {
      kind: "text",
      value: " WENT ",
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-word-order-second-conditional"), {
      kind: "ordered_list",
      value: ["If I won the lottery, I would travel the world."],
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-matching-phrasal-verbs"), {
      kind: "pairs",
      value: [
        { leftId: "left-run-out-of", rightId: "right-have-none-left" },
        { leftId: "left-give-up", rightId: "right-stop-doing" },
        { leftId: "left-look-for", rightId: "right-search" },
      ],
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-fill-blank-past-simple"), {
      kind: "text",
      value: "go",
    }).isCorrect).toBe(false);
  });

  it("returns an auditable feedback envelope and rejects unknown activities", () => {
    const feedback = gradeMockAttempt(activity("activity-fill-blank-past-simple"), {
      kind: "text",
      value: "went",
    });
    expect(feedback).toMatchObject({ activityId: "activity-fill-blank-past-simple", isCorrect: true });
    expect(feedback.attemptId).toMatch(/^attempt-/u);
    expect(feedback.submittedAt).toBeTypeOf("string");
    expect(() => gradeMockAttempt({ ...activity("activity-fill-blank-past-simple"), id: "missing" }, { kind: "text", value: "went" })).toThrow(/No hay clave/iu);
  });

  it("rejects scalar/array mismatches and unknown response kinds", () => {
    expect(gradeMockAttempt(activity("activity-single-choice-future-forms"), { kind: "multiple", value: ["opt-going-to"] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-multiple-choice-travel-vocabulary"), { kind: "single", value: "opt-anchor" }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-fill-blank-past-simple"), { kind: "ordered_list", value: ["wrong"] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-word-order-second-conditional"), { kind: "ordered_list", value: ["wrong"] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-matching-phrasal-verbs"), { kind: "pairs", value: [{ leftId: "wrong", rightId: "wrong" }] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-true-false-present-simple"), { kind: "boolean", value: true }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-single-choice-future-forms"), { kind: "boolean_list", value: [true] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-complete-dialogue-work-vocabulary"), { kind: "text", value: "work" }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-fill-blank-past-simple"), { kind: "text", value: "went" } as never).isCorrect).toBe(true);
  });
});
