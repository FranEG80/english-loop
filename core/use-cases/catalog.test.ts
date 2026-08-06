import { describe, expect, it } from "vitest";
import type { ActivityQuestionDto, LessonDetailDto, LessonSummaryDto, TaxonomyNodeDto } from "@/core/models";
import type { LearningContentPort } from "@/core/ports";
import { getActivityDetail, getLessonDetail, getTaxonomy, listActivityCatalog, listLessonCatalog } from "./catalog";

const lessonSummary: LessonSummaryDto = { id: "lesson-1", level: "B1", category: "grammar", taxonomyNodeId: "future", title: "Future forms", summary: "will and going to", tags: ["future"], difficulty: 1, status: "new" };
const advancedGrammarReframingLesson: LessonSummaryDto = { id: "b2-advanced-grammar-reframing", level: "B2", category: "use_of_english", taxonomyNodeId: "b2-advanced-grammar-reframing", title: "Pasiva, condicionales y estilo indirecto B2", summary: "Reformulación gramatical", tags: ["grammar-reframing"], difficulty: 3, status: "new" };
const lesson: LessonDetailDto = { ...lessonSummary, explanation: "Explanation", examples: [], commonMistakes: [], relatedActivityIds: ["activity-1"] };
const activity: ActivityQuestionDto = { id: "activity-1", level: "B1", taxonomyNodeId: "future", interactionMode: "standard", type: "true_false", statement: "True" };
const wordOrderActivity: ActivityQuestionDto = { id: "activity-2", level: "B2", taxonomyNodeId: "word-order", interactionMode: "sentence_builder", type: "word_order", shuffledWords: ["I", "agree"] };
const tree: TaxonomyNodeDto[] = [{ id: "grammar", type: "category", label: { en: "Grammar", es: "Gramática" }, levels: ["B1"], children: [{ id: "future", type: "topic", label: { en: "Future", es: "Futuro" }, levels: ["B1"], children: [] }] }];
const content: LearningContentPort = { listLessons: async () => [lessonSummary], getLessonById: async (id) => id === lesson.id ? lesson : null, listActivities: async () => [activity], getActivityById: async (id) => id === activity.id ? activity : null, getTaxonomyTree: async () => tree };

describe("catalog use cases", () => {
  it("filters lessons and activities case-insensitively", async () => {
    expect(await listLessonCatalog(content, { query: "FUTURE", level: "B1" })).toEqual([lessonSummary]);
    expect(await listLessonCatalog(content, { query: "unknown" })).toEqual([]);
    expect(await listActivityCatalog(content, { query: "ACTIVITY-1" })).toEqual([activity]);
    expect(await listActivityCatalog(content, { query: "unknown" })).toEqual([]);
  });

  it("finds lessons by id, category and taxonomy with normalized separators", async () => {
    const variedContent: LearningContentPort = {
      ...content,
      listLessons: async () => [lessonSummary, advancedGrammarReframingLesson],
    };

    await expect(listLessonCatalog(variedContent, { query: "b2-advanced-grammar-reframing" })).resolves.toEqual([advancedGrammarReframingLesson]);
    await expect(listLessonCatalog(variedContent, { query: "use of english" })).resolves.toEqual([advancedGrammarReframingLesson]);
    await expect(listLessonCatalog(variedContent, { query: "b2 advanced grammar reframing" })).resolves.toEqual([advancedGrammarReframingLesson]);
  });

  it("filters activities by format and interaction mode", async () => {
    const variedContent: LearningContentPort = {
      ...content,
      listActivities: async () => [activity, wordOrderActivity],
    };

    await expect(listActivityCatalog(variedContent, { type: "word_order" })).resolves.toEqual([wordOrderActivity]);
    await expect(listActivityCatalog(variedContent, { interactionMode: "standard" })).resolves.toEqual([activity]);
  });

  it("returns details, nulls and taxonomy through the port", async () => {
    expect(await getLessonDetail(content, "lesson-1")).toEqual(lesson);
    expect(await getLessonDetail(content, "missing")).toBeNull();
    expect(await getActivityDetail(content, "activity-1")).toEqual(activity);
    expect(await getActivityDetail(content, "missing")).toBeNull();
    expect(await getTaxonomy(content)).toEqual(tree);
  });
});
