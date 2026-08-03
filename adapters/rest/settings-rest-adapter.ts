import type { SettingsPort } from "@/core/ports";
import type { UserSettingsDto } from "@/core/models";
import { restRequest } from "./http-client";

export const settingsRestAdapter: SettingsPort = {
  getSettings: () => restRequest<UserSettingsDto>("/me/settings"),
  updateSettings: (patch) =>
    restRequest<UserSettingsDto>("/me/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  resetMockData: async () => {
    throw new Error("Resetting mock data is only available in mock mode.");
  },
};
