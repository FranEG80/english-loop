import { describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ identity: {}, unitOfWork: {}, dailySessionRepository: { findById: vi.fn(async () => ({ id: "session-1", practiceRunId: null })) }, lessonProgressRepository: {}, userSettingsRepository: {}, practiceRunRepository: {}, dailySessionPlanner: {}, dailyPracticePlanner: {}, getLessonCatalog: vi.fn(), getActivityCatalog: vi.fn(), getDatasetVersion: vi.fn(async () => "v1"), idGenerator: {}, clock: { nowIso: vi.fn(() => "now") }, domainEventDispatcher: {} }));
const useCases = vi.hoisted(() => ({
  getOrCreate: vi.fn(async () => ({ id: "session-1", practiceRunId: null })),
  start: vi.fn(async () => ({ run: { id: "run-1" } })),
  completeLesson: vi.fn(async () => ({ id: "session-1", practiceRunId: null })),
  skip: vi.fn(async () => ({ id: "session-1", practiceRunId: null })),
  completeDaily: vi.fn(async () => ({ id: "session-1", practiceRunId: null })),
}));
vi.mock("@/server/infrastructure/composition/composition-root", () => ({ compositionRoot: root }));
vi.mock("@/core/learning/application/use-cases/complete-lesson", () => ({ completeLesson: useCases.completeLesson }));
vi.mock("@/core/learning/application/use-cases/get-or-create-daily-session", () => ({ getOrCreateDailySession: useCases.getOrCreate }));
vi.mock("@/core/learning/application/use-cases/skip-lesson", () => ({ skipLesson: useCases.skip }));
vi.mock("@/core/learning/application/use-cases/complete-daily-session", () => ({ completeDailySession: useCases.completeDaily }));
vi.mock("@/core/learning/application/use-cases/start-daily-practice", () => ({ startDailyPractice: useCases.start }));
vi.mock("@/core/learning/application/mappers/daily-session-mapper", () => ({ toDailySessionDto: (session: unknown) => ({ mapped: session }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { completeDailySessionAction, completeLessonAction, getOrCreateDailySessionAction, skipLessonAction, startDailyPracticeAction } from "./daily-session";

describe("app daily-session actions", () => {
  it("completes a lesson and maps the resulting session", async () => {
    await expect(completeLessonAction("session-1", "lesson-1")).resolves.toEqual({ mapped: { id: "session-1", practiceRunId: null } });
    expect(useCases.completeLesson).toHaveBeenCalledWith(root.identity, root.unitOfWork, root.dailySessionRepository, root.lessonProgressRepository, "session-1", "lesson-1", "now", root.domainEventDispatcher);
  });

  it("covers session creation, practice start, skip and completion actions", async () => {
    await expect(getOrCreateDailySessionAction({ date: "2026-08-03", timezone: "Europe/Madrid" })).resolves.toEqual({ mapped: { id: "session-1", practiceRunId: null } });
    await expect(startDailyPracticeAction("session-1")).resolves.toEqual({ mapped: { id: "session-1", practiceRunId: null } });
    await expect(skipLessonAction("session-1", "lesson-1")).resolves.toEqual({ mapped: { id: "session-1", practiceRunId: null } });
    await expect(completeDailySessionAction("session-1")).resolves.toEqual({ mapped: { id: "session-1", practiceRunId: null } });
    expect(useCases.getOrCreate).toHaveBeenCalled();
    expect(useCases.start).toHaveBeenCalled();
    expect(useCases.skip).toHaveBeenCalled();
    expect(useCases.completeDaily).toHaveBeenCalled();
  });
});
