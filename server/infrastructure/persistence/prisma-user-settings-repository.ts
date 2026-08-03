import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { UserSettingsRepository } from "@/core/account/ports/user-settings-repository";
import { UserSettings } from "@/core/account/domain/user-settings";
import { getPrismaClient } from "../database/prisma-transaction-context";

/**
 * Adaptador Prisma del repositorio de settings. Traduce entre el modelo de
 * dominio y el modelo persistente. Los modelos Prisma no salen de aquí.
 */
export class PrismaUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly client: PrismaClient) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const row = await getPrismaClient(this.client).userSettings.findUnique({
      where: { userId },
    });
    if (!row) return null;
    return UserSettings.create({
      userId: row.userId,
      locale: row.locale as never,
      activeLevels: JSON.parse(row.activeLevels) as never,
      dailyGoalLessons: row.dailyGoalLessons,
      dailyGoalActivities: row.dailyGoalActivities,
      timezone: row.timezone,
      reducedMotion: row.reducedMotion,
    });
  }

  async save(settings: UserSettings): Promise<void> {
    const dto = settings.toDto();
    await getPrismaClient(this.client).userSettings.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        locale: dto.locale,
        activeLevels: JSON.stringify(dto.activeLevels),
        dailyGoalLessons: dto.dailyGoalLessons,
        dailyGoalActivities: dto.dailyGoalActivities,
        timezone: dto.timezone,
        reducedMotion: dto.reducedMotion,
      },
      update: {
        locale: dto.locale,
        activeLevels: JSON.stringify(dto.activeLevels),
        dailyGoalLessons: dto.dailyGoalLessons,
        dailyGoalActivities: dto.dailyGoalActivities,
        timezone: dto.timezone,
        reducedMotion: dto.reducedMotion,
      },
    });
  }
}
