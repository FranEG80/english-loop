import { beforeEach, describe, expect, it } from "vitest";
import { mockDefaultSettings } from "./data/settings";
import { settingsMockAdapter } from "./settings-mock-adapter";

describe("settingsMockAdapter", () => {
  beforeEach(() => settingsMockAdapter.resetMockData());

  it("updates values and can restore the defaults", async () => {
    await settingsMockAdapter.updateSettings({ locale: "en", reducedMotion: true });
    expect(await settingsMockAdapter.getSettings()).toMatchObject({ locale: "en", reducedMotion: true });
    await settingsMockAdapter.resetMockData();
    expect(await settingsMockAdapter.getSettings()).toEqual(mockDefaultSettings);
  });
});
