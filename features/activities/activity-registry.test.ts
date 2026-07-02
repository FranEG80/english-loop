import { describe, expect, it } from "vitest";
import type { ActivityType } from "@/core/models";
import { mockActivities, mockActivityAnswerKeys } from "@/adapters/mock/data/activities";
import { ACTIVITY_REGISTRY } from "./activity-registry";
import { gradeMockAttempt } from "@/adapters/mock/grading";

const EXPECTED_TYPES = [
  "true_false",
  "single_choice",
  "multiple_choice",
  "fill_blank",
  "sentence_transformation",
  "error_correction",
  "word_formation",
  "open_cloze",
  "key_word_transformation",
  "matching",
  "word_order",
  "rewrite_sentence",
  "complete_dialogue",
  "complete_paragraph",
] as const satisfies readonly ActivityType[];

describe("activity coverage", () => {
  it("registers every activity type", () => {
    expect(Object.keys(ACTIVITY_REGISTRY).sort()).toEqual(
      [...EXPECTED_TYPES].sort(),
    );
  });

  it("provides at least one fixture for every activity type", () => {
    const fixtureTypes = new Set(mockActivities.map((activity) => activity.type));
    for (const type of EXPECTED_TYPES) {
      expect(fixtureTypes.has(type), `Missing fixture for ${type}`).toBe(true);
    }
  });

  it("provides a grading key for every fixture", () => {
    for (const activity of mockActivities) {
      expect(
        mockActivityAnswerKeys[activity.id],
        `Missing answer key for ${activity.id}`,
      ).toBeDefined();
    }
  });

  it("uses an interaction mode accepted by its registry entry", () => {
    for (const activity of mockActivities) {
      expect(
        ACTIVITY_REGISTRY[activity.type].interactionModes,
        `${activity.id} has an unsupported interaction mode`,
      ).toContain(activity.interactionMode);
    }
  });

  it("grades the complete swipe deck as one activity", () => {
    const activity = mockActivities.find(
      (item) => item.type === "true_false",
    );
    expect(activity).toBeDefined();
    if (!activity) return;

    const feedback = gradeMockAttempt(activity, {
      kind: "boolean_list",
      value: [false, true, false, true],
    });
    expect(feedback.isCorrect).toBe(true);
  });
});
