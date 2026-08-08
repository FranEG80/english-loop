import { describe, expect, it } from "vitest";
import type { DailySessionDto, LessonDetailDto, ActivityQuestionDto } from "@/core/models";
import type { DailySessionPort, LearningContentPort } from "@/core/ports";
import { getDailyLoop } from "./daily-loop";

const lesson: LessonDetailDto = { id: "lesson-1", level: "B1", category: "grammar", taxonomyNodeId: "topic", title: "Lesson", summary: "Summary", tags: [], difficulty: 1, status: "new", explanation: "", examples: [], commonMistakes: [], relatedActivityIds: [] };
const activity: ActivityQuestionDto = { id: "a1", level: "B1", taxonomyNodeId: "topic", type: "true_false", skillFocus: "true_false", presentation: "true_false", instructions: "Decide.", statement: "True" };
const session: DailySessionDto = { id: "session-1", date: "2026-08-04", status: "practice", recommendedLessonId: "lesson-1", practiceRunId: "run-1", activityIds: ["a1", "missing"], goal: { targetActivities: 2, completedActivities: 0 }, streakDays: 0 };

describe("getDailyLoop", () => {
  it("loads the recommended lesson and filters missing activities", async () => {
    const daily: DailySessionPort = { getTodaySession: async () => session, startDailyPractice: async () => session, submitDailyAttempt: async () => ({ attemptId: "a", activityId: "a1", isCorrect: true, score: 1, items: [], correctAnswer: "true", normalizedResponse: { kind: "boolean", value: true }, explanation: "", nextReviewAt: null, submittedAt: "now" }), completeDailySession: async () => session };
    const content: LearningContentPort = { listLessons: async () => [], getLessonById: async (id) => id === lesson.id ? lesson : null, listActivities: async () => [], getActivityById: async (id) => id === activity.id ? activity : null, getTaxonomyTree: async () => [] };
    await expect(getDailyLoop(daily, content, "UTC")).resolves.toEqual({ dailySession: session, lesson, activities: [activity] });
  });
});
