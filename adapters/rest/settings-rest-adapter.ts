import type { SettingsPort } from "@/core/ports";
import type { UserSettingsDto } from "@/core/models";
import { restRequest } from "./http-client";

export const settingsRestAdapter: SettingsPort = {
  getSettings: () => restRequest<UserSettingsDto>("/settings"),
  updateSettings: (patch) =>
    restRequest<UserSettingsDto>("/settings", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  resetMockData: () =>
    restRequest<void>("/settings/reset", { method: "POST" }),
};
