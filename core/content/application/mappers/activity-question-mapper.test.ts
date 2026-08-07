import { describe, expect, it } from "vitest";
import type { Activity } from "../../domain/types/activity";
import { toActivityQuestionDto } from "./activity-question-mapper";

function activity(type: string, extras: Partial<Activity> = {}): Activity {
  return {
    id: `activity-${type}`,
    level: "B1",
    type,
    category: "grammar",
    topic: "topic",
    subtopic: "subtopic",
    taxonomyNodeIds: ["subtopic"],
    difficulty: 1,
    instructions: "Transform it",
    prompt: "Prompt",
    lessonIds: ["lesson-1"],
    tags: [],
    estimatedSeconds: 30,
    evaluator: { strategy: "boolean", correct: true },
    explanation: "Private explanation",
    status: "published",
    ...extras,
  };
}

describe("toActivityQuestionDto", () => {
  it("maps every supported interaction without leaking evaluator data", () => {
    const cases = [
      ["true_false", { statement: "Prompt" }],
      ["single_choice", { question: "Prompt", options: [{ id: "a", label: "A" }] }],
      ["multiple_select", { question: "Prompt", options: [{ id: "a", label: "A" }] }],
      ["fill_blank", { textWithGap: "Prompt" }],
      ["word_order", { shuffledWords: ["one"] }],
      ["matching", { leftItems: [{ id: "l", label: "Left" }] }],
      ["sentence_transformation", { originalSentence: "Prompt", wordBank: ["one"] }],
      ["error_correction", { sentenceWithError: "Prompt" }],
      ["word_formation", { sentenceWithGap: "Prompt", baseWord: "one" }],
      ["open_cloze", { textWithGaps: "Prompt", gapCount: 1 }],
      ["key_word_transformation", { firstSentence: "Prompt", keyword: "one" }],
      ["complete_dialogue", { dialogueLines: [{ speaker: "t", text: "one", hasGap: false }] }],
      ["complete_paragraph", { question: "Prompt", paragraphWithGaps: "Prompt", gapCount: 1 }],
    ] as const;

    for (const [type, expected] of cases) {
      const dto = toActivityQuestionDto(activity(type, {
        options: [{ id: "a", text: "A" }],
        tokens: [{ id: "t", text: "one" }],
        pairs: [{ leftId: "l", left: "Left", rightId: "r", right: "Right" }],
      }));
      expect(dto).toMatchObject({ id: `activity-${type}`, level: "B1", ...expected });
      expect(dto).not.toHaveProperty("evaluator");
      expect(dto).not.toHaveProperty("explanation");
    }
  });

  it("uses safe fallbacks for unknown types and interaction modes", () => {
    expect(toActivityQuestionDto(activity("unknown"))).toMatchObject({
      type: "fill_blank", skillFocus: "fill_blank",
      interactionMode: "standard",
      textWithGap: "Prompt",
    });
    expect(toActivityQuestionDto(activity("word_order"))).toMatchObject({
      interactionMode: "sentence_builder",
    });
    expect(toActivityQuestionDto(activity("matching"))).toMatchObject({
      interactionMode: "matching_pairs",
    });
  });

  it("uses safe defaults when optional question content is absent", () => {
    expect(toActivityQuestionDto(activity("word_formation", { tokens: [] }))).toMatchObject({ baseWord: "" });
    expect(toActivityQuestionDto(activity("open_cloze", { tokens: undefined }))).toMatchObject({ gapCount: 1 });
    expect(toActivityQuestionDto(activity("key_word_transformation", { tokens: [] }))).toMatchObject({ keyword: "" });
    expect(toActivityQuestionDto(activity("complete_paragraph", { passage: "First sentence with ___ here. Second sentence follows." , tokens: undefined }))).toMatchObject({
      question: "Prompt",
      paragraphWithGaps: "First sentence with ___ here. Second sentence follows.",
      gapCount: 1,
    });
    expect(toActivityQuestionDto(activity("single_choice", { options: undefined }))).toMatchObject({ options: [] });
    expect(toActivityQuestionDto(activity("multiple_select", { options: undefined }))).toMatchObject({ options: [] });
    expect(toActivityQuestionDto(activity("word_order", { tokens: undefined }))).toMatchObject({ shuffledWords: [] });
    expect(toActivityQuestionDto(activity("matching", { pairs: undefined }))).toMatchObject({ leftItems: [], rightItems: [] });
    expect(toActivityQuestionDto(activity("sentence_transformation", { tokens: undefined }))).toMatchObject({ wordBank: [] });
    expect(toActivityQuestionDto(activity("complete_dialogue", { tokens: undefined }))).toMatchObject({ dialogueLines: [] });
  });
});
