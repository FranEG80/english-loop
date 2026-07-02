import type { SettingsPort } from "@/core/ports";
import type { UserSettingsDto } from "@/core/models";
import { mockDefaultSettings } from "./data/settings";

/** Estado en memoria del proceso de desarrollo (mock de un único usuario). */
let currentSettings: UserSettingsDto = { ...mockDefaultSettings };

export const settingsMockAdapter: SettingsPort = {
  async getSettings() {
    return currentSettings;
  },
  async updateSettings(patch) {
    currentSettings = { ...currentSettings, ...patch };
    return currentSettings;
  },
  async resetMockData() {
    currentSettings = { ...mockDefaultSettings };
  },
};
