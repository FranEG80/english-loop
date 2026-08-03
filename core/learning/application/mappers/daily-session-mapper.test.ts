import { describe, expect, it } from "vitest";
import { DailySession } from "../../domain/daily-session";
import { PracticeRun } from "@/core/practice/domain/practice-run";
import { toDailySessionDto } from "./daily-session-mapper";

function session() {
  const value = DailySession.create({
    id: "session-1",
    userId: "user-1",
    date: "2026-08-04",
    status: "lesson",
    datasetVersion: "v1",
    seed: "seed",
    lessons: [{ lessonId: "lesson-1", order: 0, status: "pending", selectionReason: "new", completedAt: null }],
    practiceRunId: null,
    createdAt: "2026-08-04T00:00:00.000Z",
  });
  return value;
}

describe("toDailySessionDto", () => {
  it("selects the pending lesson and defaults the goal without a run", () => {
    expect(toDailySessionDto(session())).toEqual({
      id: "session-1",
      date: "2026-08-04",
      status: "lesson",
      recommendedLessonId: "lesson-1",
      activityIds: [],
      goal: { targetActivities: 10, completedActivities: 0 },
      streakDays: 0,
    });
  });

  it("uses run activity count and supplied progress", () => {
    const run = PracticeRun.create({
      id: "run-1", userId: "user-1", mode: "DAILY",
      scope: { level: "B1", taxonomyNodeId: "daily", taxonomyPath: [], descendantIds: [], requestedCount: 5 },
      activityIds: ["a1", "a2"], currentIndex: 1, status: "in_progress", datasetVersion: "v1", dailySessionId: "session-1", createdAt: "now",
    });
    expect(toDailySessionDto(session(), run, 1).goal).toEqual({ targetActivities: 2, completedActivities: 1 });
  });
});
