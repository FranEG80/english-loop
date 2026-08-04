import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const lesson = {
    id: "demo-lesson",
    level: "B1",
    category: "grammar",
    taxonomyNodeId: "grammar",
    prerequisiteLessonIds: [],
    title: "Demo lesson",
    summary: "A seeded demo lesson.",
    explanation: "Explanation",
    examples: [],
    commonMistakes: [],
    relatedActivityIds: ["demo-activity"],
    tags: [],
    difficulty: 1,
    status: "published",
    contentVersion: 1,
  };
  const activity = {
    id: "demo-activity",
    level: "B1",
    type: "true_false",
    category: "grammar",
    topic: "grammar",
    subtopic: "grammar",
    taxonomyNodeIds: ["grammar"],
    difficulty: 1,
    instructions: "Choose",
    prompt: "The demo is read only.",
    lessonIds: ["demo-lesson"],
    tags: [],
    estimatedSeconds: 30,
    evaluator: { strategy: "boolean", correct: true },
    explanation: "Explanation",
    status: "published",
  };
  const catalog = {
    listLessons: vi.fn().mockResolvedValue([lesson]),
    getLessonById: vi.fn().mockResolvedValue(lesson),
    listActivities: vi.fn().mockResolvedValue([activity]),
    getActivityById: vi.fn().mockResolvedValue(activity),
    getTaxonomyTree: vi.fn().mockResolvedValue([{ id: "grammar", parentId: null, kind: "topic", labels: { en: "Grammar", es: "Gramática" }, levels: ["B1"], selectableForPractice: true, order: 1, children: [] }]),
  };
  const settings = {
    activeLevels: ["B1", "B2"],
    dailyGoalActivities: 1,
  };
  return {
    catalog,
    settings,
    compositionRoot: {
      getDemoCatalog: vi.fn(() => catalog),
      userSettingsRepository: { findByUserId: vi.fn().mockResolvedValue(settings) },
      progressRepository: { getOverview: vi.fn().mockResolvedValue({ totalActivitiesCompleted: 2, totalCorrect: 1, totalAttempts: 2, strongTopicIds: [], weakTopicIds: [] }), getTaxonomyProgress: vi.fn().mockResolvedValue(null) },
      reviewRepository: { findDueByUserId: vi.fn().mockResolvedValue([]), findUpcomingByUserId: vi.fn().mockResolvedValue([]) },
      lessonProgressRepository: { findByUserId: vi.fn().mockResolvedValue([{ viewed: true }]) },
      attemptRepository: { findByUserIdAndActivityId: vi.fn().mockResolvedValue([]) },
    },
  };
});

vi.mock("@/server/infrastructure/composition/composition-root", () => ({ compositionRoot: mocks.compositionRoot }));

describe("demo server adapters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads content and progress from the seeded demo-owned ports", async () => {
    const { demoLearningContentAdapter, demoProgressAdapter, demoSession } = await import("./demo-adapters");

    await expect(demoLearningContentAdapter.listLessons()).resolves.toMatchObject([{ id: "demo-lesson", status: "new" }]);
    await expect(demoLearningContentAdapter.getActivityById("demo-activity")).resolves.toMatchObject({ id: "demo-activity", type: "true_false" });
    await expect(demoProgressAdapter.getOverview()).resolves.toMatchObject({ totalLessonsViewed: 1, totalActivitiesCompleted: 2, accuracyRate: 0.5 });
    expect(demoSession).toMatchObject({ userId: "user-demo", email: "demo@englishloop.local" });
    expect(mocks.compositionRoot.progressRepository.getOverview).toHaveBeenCalledWith("user-demo");
  });

  it("builds a read-only daily loop from seeded content and refuses writes", async () => {
    const { demoDailySessionAdapter } = await import("./demo-adapters");

    await expect(demoDailySessionAdapter.getTodaySession("UTC")).resolves.toMatchObject({
      recommendedLessonId: "demo-lesson",
      activityIds: ["demo-activity"],
      goal: { targetActivities: 1, completedActivities: 0 },
    });
    await expect(demoDailySessionAdapter.startDailyPractice("demo-session")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(demoDailySessionAdapter.completeDailySession("demo-session")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
