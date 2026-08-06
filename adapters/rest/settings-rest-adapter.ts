import type { SettingsPort } from "@/core/ports";
import type { UserSettingsDto } from "@/core/models";
import { restRequest } from "./http-client";

type SettingsRestPatch = Omit<Partial<UserSettingsDto>, "dailyGoal"> & {
  dailyGoalActivities?: number;
};

function toSettingsRestPatch(patch: Partial<UserSettingsDto>): SettingsRestPatch {
  const { dailyGoal, ...rest } = patch;
  return {
    ...rest,
    ...(dailyGoal === undefined ? {} : { dailyGoalActivities: dailyGoal }),
  };
}

export const settingsRestAdapter: SettingsPort = {
  getSettings: () => restRequest<UserSettingsDto>("/me/settings"),
  updateSettings: (patch) =>
    restRequest<UserSettingsDto>("/me/settings", {
      method: "PATCH",
      body: JSON.stringify(toSettingsRestPatch(patch)),
    }),
  resetMockData: async () => {
    throw new Error("Resetting mock data is only available in mock mode.");
  },
};
