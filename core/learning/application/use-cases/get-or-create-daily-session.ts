import type { IdentityPort } from "@/core/account/ports/identity-port";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import type { LessonCatalogPort } from "@/core/content/ports/catalog-ports";
import { UniqueId, type ClockPort, type DomainEventDispatcherPort, type IdGeneratorPort } from "@/core/shared/kernel";
import { ValidationException } from "@/core/shared/exceptions";
import type { DailySessionRepository } from "../../ports/daily-session-repository";
import type { LessonProgressRepository } from "../../ports/lesson-progress-repository";
import { DailySession } from "../../domain/daily-session";
import { DailySessionPlanner } from "../../domain/daily-session-planner";

export interface GetOrCreateDailySessionInput {
  /** Fallback inicial; una sesión existente usa siempre la fecha persistida. */
  timezone?: string;
  /** Se conserva por compatibilidad de comandos antiguos, pero se ignora. */
  date?: string;
}

export function localDateForTimezone(now: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const values = new Map(parts.map((part) => [part.type, part.value]));
    return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
  } catch {
    throw new ValidationException("Invalid IANA timezone", {
      timezone: ["Must be a valid IANA timezone"],
    });
  }
}

/** Obtiene o crea la sesión diaria idempotente para el día local persistido. */
export async function getOrCreateDailySession(
  identity: IdentityPort,
  sessionRepository: DailySessionRepository,
  userSettingsRepository: UserSettingsRepository,
  lessonCatalog: LessonCatalogPort,
  lessonProgressRepository: LessonProgressRepository,
  planner: DailySessionPlanner,
  idGenerator: IdGeneratorPort,
  clock: ClockPort,
  domainEventDispatcher: DomainEventDispatcherPort,
  datasetVersion: string,
  input: GetOrCreateDailySessionInput = {},
): Promise<DailySession> {
  const actor = await identity.requireActor();
  const settings = await userSettingsRepository.findByUserId(actor.userId);
  const timezone = settings?.timezone ?? input.timezone ?? "UTC";
  const date = localDateForTimezone(clock.now(), timezone);

  const existing = await sessionRepository.findByUserIdAndDate(actor.userId, date);
  if (existing) return existing;

  const lessonProgress = await lessonProgressRepository.findByUserId(actor.userId);
  const viewedLessonIds = lessonProgress
    .filter((record) => record.viewed && record.errorsPending === 0)
    .map((record) => record.lessonId);
  const errorLessonIds = lessonProgress
    .filter((record) => record.errorsPending > 0)
    .map((record) => record.lessonId);
  const activeLevel = settings?.activeLevels[0] ?? actor.activeLevels[0] ?? "B1";
  const lessonCount = settings?.dailyGoalLessons ?? 1;
  const selections = await planner.plan(lessonCatalog, {
    level: activeLevel,
    viewedLessonIds,
    errorLessonIds,
    count: lessonCount,
  });

  const session = DailySession.create({
    id: UniqueId.create(idGenerator).toString(),
    userId: actor.userId,
    date,
    status: "not_started",
    datasetVersion,
    seed: UniqueId.create(idGenerator).toString(),
    lessons: selections.map((selection, index) => ({
      lessonId: selection.lessonId,
      order: index,
      status: "pending",
      selectionReason: selection.selectionReason,
      completedAt: null,
    })),
    practiceRunId: null,
    createdAt: clock.nowIso(),
  });
  session.startLessonPhase(clock.nowIso());

  try {
    await sessionRepository.save(session);
  } catch (error) {
    // Concurrent creators race on the unique (userId, date) constraint.
    const concurrent = await sessionRepository.findByUserIdAndDate(actor.userId, date);
    if (concurrent) return concurrent;
    throw error;
  }
  await domainEventDispatcher.dispatch(session.pullDomainEvents());
  return session;
}
