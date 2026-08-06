import { beforeEach, describe, expect, it, vi } from "vitest";

const ports = vi.hoisted(() => ({
  updateSettings: vi.fn(),
  resetMockData: vi.fn(),
  setLocale: vi.fn(),
}));
vi.mock("@/adapters/adapter-factory", () => ({
  getSettingsPort: () => ports,
  getLocalePort: () => ports,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { resetSettingsAction, updateSettingsAction } from "./actions";

describe("settings server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes form values and updates settings and locale", async () => {
    const form = new FormData();
    form.set("locale", "en");
    form.append("activeLevels", "B1");
    form.append("activeLevels", "B2");
    form.set("dailyGoal", "99");
    form.set("reducedMotion", "on");
    const result = await updateSettingsAction(undefined, form);
    expect(ports.updateSettings).toHaveBeenCalledWith({
      locale: "en",
      activeLevels: ["B1", "B2"],
      dailyGoal: 20,
      reducedMotion: true,
    });
    expect(ports.setLocale).toHaveBeenCalledWith("en");
    expect(result).toEqual({ success: "Settings saved." });
  });

  it("returns localized feedback when settings cannot be saved", async () => {
    ports.updateSettings.mockRejectedValueOnce(new Error("Unavailable"));
    const form = new FormData();
    form.set("locale", "es");

    const result = await updateSettingsAction(undefined, form);

    expect(result).toEqual({
      error: "No se pudieron guardar los ajustes. Inténtalo de nuevo.",
    });
  });

  it("resets mock settings and locale to Spanish", async () => {
    await resetSettingsAction();
    expect(ports.resetMockData).toHaveBeenCalledOnce();
    expect(ports.setLocale).toHaveBeenCalledWith("es");
  });
});
