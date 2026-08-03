import type { UserSettings } from "../domain/user-settings";

export interface UserSettingsRepository {
  findByUserId(userId: string): Promise<UserSettings | null>;
  save(settings: UserSettings): Promise<void>;
}
