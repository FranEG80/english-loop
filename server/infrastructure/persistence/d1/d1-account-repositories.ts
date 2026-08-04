import type { SavedLessonRepository } from "@/core/account/ports/saved-lesson-repository";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import type { D1TransportClient } from "./types/transport";
import { SavedLesson } from "@/core/account/domain/saved-lesson";
import { UserSettings } from "@/core/account/domain/user-settings";
import type { D1SavedLessonSnapshot, D1UserSettingsSnapshot } from "./types/operations";
import { bool, first, iso, rows, text, type Row } from "./mappers/d1-row-mapper";
import { operation } from "./operations/request";

export class D1UserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly transport: D1TransportClient) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const row = first<Row>(await this.transport.execute(operation({ name: "userSettingsGet", userId })));
    if (!row) return null;
    return UserSettings.create({
      userId: text(row.userId), locale: text(row.locale) as never,
      activeLevels: JSON.parse(text(row.activeLevels)) as never,
      dailyGoalLessons: Number(row.dailyGoalLessons), dailyGoalActivities: Number(row.dailyGoalActivities),
      timezone: text(row.timezone), reducedMotion: bool(row.reducedMotion),
    });
  }

  async save(settings: UserSettings): Promise<void> {
    const dto = settings.toDto();
    const snapshot: D1UserSettingsSnapshot = {
      userId: dto.userId, locale: dto.locale, activeLevels: JSON.stringify(dto.activeLevels),
      dailyGoalLessons: dto.dailyGoalLessons, dailyGoalActivities: dto.dailyGoalActivities,
      timezone: dto.timezone, reducedMotion: dto.reducedMotion,
    };
    await this.transport.execute(operation({ name: "userSettingsSave", snapshot }));
  }
}

export class D1SavedLessonRepository implements SavedLessonRepository {
  constructor(private readonly transport: D1TransportClient) {}

  private toDomain(row: Row): SavedLesson {
    return SavedLesson.create({ userId: text(row.userId), lessonId: text(row.lessonId), savedAt: iso(row.savedAt) });
  }

  async findByUserId(userId: string): Promise<SavedLesson[]> {
    return rows(await this.transport.execute(operation({ name: "savedLessonsList", userId }))).map((row) => this.toDomain(row));
  }

  async findByUserAndLesson(userId: string, lessonId: string): Promise<SavedLesson | null> {
    const row = first<Row>(await this.transport.execute(operation({ name: "savedLessonGet", userId, lessonId })));
    return row ? this.toDomain(row) : null;
  }

  async save(lesson: SavedLesson): Promise<void> {
    const snapshot: D1SavedLessonSnapshot = { userId: lesson.userId, lessonId: lesson.lessonId, savedAt: lesson.savedAt };
    await this.transport.execute(operation({ name: "savedLessonSave", snapshot }));
  }

  async delete(userId: string, lessonId: string): Promise<void> {
    await this.transport.execute(operation({ name: "savedLessonDelete", userId, lessonId }));
  }
}
