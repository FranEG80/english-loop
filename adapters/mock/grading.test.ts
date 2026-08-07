import { describe, expect, it } from "vitest";
import { gradeMockAttempt } from "./grading";
import { mockActivities } from "./data/activities";

function activity(id: string) {
  const value = mockActivities.find((item) => item.id === id);
  if (!value) throw new Error(`Fixture not found: ${id}`);
  return value;
}

describe("mock grader", () => {
  it("grades decks, single and multiple choices", () => {
    expect(gradeMockAttempt(activity("activity-swipe-deck-present-simple"), {
      kind: "deck",
      value: [
        { cardId: "tf-present-1", value: false },
        { cardId: "tf-present-2", value: true },
        { cardId: "tf-present-3", value: false },
        { cardId: "tf-present-4", value: true },
        { cardId: "tf-present-5", value: false },
      ],
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
    expect(gradeMockAttempt(activity("activity-gap-fill-past-simple"), {
      kind: "text",
      value: " WENT ",
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-word-order-relative-clauses"), {
      kind: "ordered_list",
      value: ["tok-the-woman", "tok-who", "tok-lives", "tok-next-door", "tok-is-a-vet"],
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-matching-phrasal-verbs"), {
      kind: "pairs",
      value: [
        { leftId: "left-get-up", rightId: "right-leave-bed" },
        { leftId: "left-give-up", rightId: "right-stop" },
        { leftId: "left-look-after", rightId: "right-take-care" },
        { leftId: "left-put-off", rightId: "right-postpone" },
      ],
    }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-gap-fill-past-simple"), {
      kind: "text",
      value: "go",
    }).isCorrect).toBe(false);
  });

  it("returns an auditable feedback envelope and rejects unknown activities", () => {
    const feedback = gradeMockAttempt(activity("activity-gap-fill-past-simple"), {
      kind: "text",
      value: "went",
    });
    expect(feedback).toMatchObject({ activityId: "activity-gap-fill-past-simple", isCorrect: true });
    expect(feedback.attemptId).toMatch(/^attempt-/u);
    expect(feedback.submittedAt).toBeTypeOf("string");
    expect(() => gradeMockAttempt({ ...activity("activity-gap-fill-past-simple"), id: "missing" }, { kind: "text", value: "went" })).toThrow(/No hay clave/iu);
  });

  it("rejects scalar/array mismatches and unknown response kinds", () => {
    expect(gradeMockAttempt(activity("activity-single-choice-future-forms"), { kind: "multiple", value: ["opt-going-to"] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-multiple-choice-travel-vocabulary"), { kind: "single", value: "opt-anchor" }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-gap-fill-past-simple"), { kind: "ordered_list", value: ["wrong"] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-word-order-relative-clauses"), { kind: "ordered_list", value: ["wrong"] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-matching-phrasal-verbs"), { kind: "pairs", value: [{ leftId: "wrong", rightId: "wrong" }] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-true-false-present-simple"), { kind: "boolean", value: true }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-single-choice-future-forms"), { kind: "deck", value: [{ cardId: "x", value: true }] }).isCorrect).toBe(false);
    expect(gradeMockAttempt(activity("activity-gap-fill-dialogue-requests"), { kind: "text", value: "I can" }).isCorrect).toBe(true);
    expect(gradeMockAttempt(activity("activity-gap-fill-past-simple"), { kind: "text", value: "went" } as never).isCorrect).toBe(true);
  });
});
