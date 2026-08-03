import type { UserSettingsDto } from "../models/types/settings";

export interface SettingsPort {
  getSettings(): Promise<UserSettingsDto>;
  updateSettings(patch: Partial<UserSettingsDto>): Promise<UserSettingsDto>;
  /** Restablece todos los datos mock a su estado inicial. */
  resetMockData(): Promise<void>;
}
