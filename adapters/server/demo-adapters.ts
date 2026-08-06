import "server-only";
import type {
  AuthSession,
  DailySessionDto,
  ProgressOverviewDto,
  ReviewQueueDto,
  TaxonomyProgressDto,
  ActivityHistoryDto,
} from "@/core/models";
import type { DailySessionPort, LearningContentPort, ProgressPort } from "@/core/ports";
import { toActivityQuestionDto } from "@/core/content/application/mappers/activity-question-mapper";
import { toLessonDetailDto, toLessonSummaryDto } from "@/core/content/application/mappers/lesson-mapper";
import { toTaxonomyNodeDto } from "@/core/content/application/mappers/taxonomy-mapper";
import {
  DEMO_USER_ACTIVE_LEVELS,
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  DEMO_USER_NAME,
} from "@/core/content/domain/demo-fixture";
import { DEMO_DAILY_GOAL_ACTIVITIES } from "@/core/content/domain/demo-fixture";
import { ForbiddenException } from "@/core/shared/exceptions";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";

export const demoSession: AuthSession = {
  userId: DEMO_USER_ID,
  name: DEMO_USER_NAME,
  email: DEMO_USER_EMAIL,
  isDemo: true,
  activeLevels: [...DEMO_USER_ACTIVE_LEVELS],
};

const demoCatalog = compositionRoot.getDemoCatalog();

export const demoLearningContentAdapter: LearningContentPort = {
  async listLessons(filters) {
    const lessons = await demoCatalog.listLessons(filters);
    return lessons.map(toLessonSummaryDto);
  },
  async getLessonById(lessonId) {
    const lesson = await demoCatalog.getLessonById(lessonId);
    return lesson ? toLessonDetailDto(lesson) : null;
  },
  async searchLessonsPage(filters, pagination) {
    const page = await demoCatalog.searchLessonsPage(filters, pagination);
    return { ...page, items: page.items.map(toLessonSummaryDto) };
  },
  async listActivities(filters) {
    const activities = await demoCatalog.listActivities(filters);
    return activities.map(toActivityQuestionDto);
  },
  async getActivityById(activityId) {
    const activity = await demoCatalog.getActivityById(activityId);
    return activity ? toActivityQuestionDto(activity) : null;
  },
  async searchActivitiesPage(filters, pagination) {
    const page = await demoCatalog.searchActivitiesPage(
      {
        taxonomyNodeId: filters?.taxonomyNodeId,
        level: filters?.level,
        lessonIds: filters?.lessonIds,
        query: filters?.query,
        activityType: filters?.type === "multiple_choice"
          ? "multiple_select"
          : filters?.type,
        interactionMode: filters?.interactionMode,
      },
      pagination,
    );
    return { ...page, items: page.items.map(toActivityQuestionDto) };
  },
  async getTaxonomyTree() {
    const tree = await demoCatalog.getTaxonomyTree();
    return tree.map(toTaxonomyNodeDto);
  },
};

function localDate(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

function readOnly(operation: string): never {
  throw new ForbiddenException(
    `Demo operation is read-only: ${operation}`,
    "La demo es de solo lectura. Regístrate para guardar tu progreso.",
  );
}

export const demoDailySessionAdapter: DailySessionPort = {
  async getTodaySession(timezone): Promise<DailySessionDto> {
    const settings = await compositionRoot.userSettingsRepository.findByUserId(DEMO_USER_ID);
    const activeLevel = settings?.activeLevels[0] ?? DEMO_USER_ACTIVE_LEVELS[0];
    const [lessons, activities] = await Promise.all([
      demoCatalog.listLessons({ level: activeLevel }),
      demoCatalog.listActivities({ level: "both" }),
    ]);
    const recommendedLesson = lessons[0];
    if (!recommendedLesson) {
      throw new Error("The demo catalog has no seeded lessons");
    }
    const targetActivities = settings?.dailyGoalActivities ?? DEMO_DAILY_GOAL_ACTIVITIES;
    const activityIds = activities.slice(0, targetActivities).map((activity) => activity.id);
    return {
      id: `demo-daily-${localDate(timezone)}`,
      date: localDate(timezone),
      status: "not_started",
      recommendedLessonId: recommendedLesson.id,
      practiceRunId: null,
      activityIds,
      goal: { targetActivities, completedActivities: 0 },
      streakDays: 0,
    };
  },
  async startDailyPractice() {
    return readOnly("startDailyPractice");
  },
  async submitDailyAttempt() {
    return readOnly("submitDailyAttempt");
  },
  async completeDailySession() {
    return readOnly("completeDailySession");
  },
};

function reviewItemDto(item: Awaited<ReturnType<typeof compositionRoot.reviewRepository.findDueByUserId>>[number]) {
  return {
    id: item.id,
    activityId: item.activityId,
    taxonomyNodeId: item.taxonomyNodeId,
    level: item.level,
    failedAt: item.failedAt,
    dueAt: item.dueAt,
    attemptsCount: item.attemptsCount,
  };
}

export const demoProgressAdapter: ProgressPort = {
  async getOverview(): Promise<ProgressOverviewDto> {
    const [settings, overview, due, lessons] = await Promise.all([
      compositionRoot.userSettingsRepository.findByUserId(DEMO_USER_ID),
      compositionRoot.progressRepository.getOverview(DEMO_USER_ID),
      compositionRoot.reviewRepository.findDueByUserId(DEMO_USER_ID, new Date().toISOString()),
      compositionRoot.lessonProgressRepository.findByUserId(DEMO_USER_ID),
    ]);
    return {
      activeLevels: settings?.activeLevels ?? [...DEMO_USER_ACTIVE_LEVELS],
      streakDays: 0,
      accuracyRate: overview.totalAttempts > 0 ? overview.totalCorrect / overview.totalAttempts : 0,
      totalLessonsViewed: lessons.filter((lesson) => lesson.viewed).length,
      totalActivitiesCompleted: overview.totalActivitiesCompleted,
      strongTopicIds: overview.strongTopicIds,
      weakTopicIds: overview.weakTopicIds,
      pendingReviewCount: due.length,
      weeklyActivity: [],
    };
  },
  async getReviewQueue(): Promise<ReviewQueueDto> {
    const nowIso = new Date().toISOString();
    const [due, upcoming] = await Promise.all([
      compositionRoot.reviewRepository.findDueByUserId(DEMO_USER_ID, nowIso),
      compositionRoot.reviewRepository.findUpcomingByUserId(DEMO_USER_ID, nowIso),
    ]);
    return { dueItems: due.map(reviewItemDto), upcomingItems: upcoming.map(reviewItemDto) };
  },
  async getTaxonomyProgress(nodeId): Promise<TaxonomyProgressDto> {
    const progress = await compositionRoot.progressRepository.getTaxonomyProgress(DEMO_USER_ID, nodeId);
    const attemptsCount = progress?.attemptsCount ?? 0;
    const correctCount = progress?.correctCount ?? 0;
    return { taxonomyNodeId: nodeId, attemptsCount, correctCount, accuracyRate: attemptsCount > 0 ? correctCount / attemptsCount : 0 };
  },
  async getActivityHistory(activityId): Promise<ActivityHistoryDto> {
    const attempts = await compositionRoot.attemptRepository.findByUserIdAndActivityId(DEMO_USER_ID, activityId);
    return {
      activityId,
      attempts: attempts.map((attempt) => ({ id: attempt.id, isCorrect: attempt.isCorrect, submittedAt: attempt.submittedAt, origin: attempt.origin })),
    };
  },
};
