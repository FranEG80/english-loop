import { describe, expect, it, vi } from "vitest";

const ports = vi.hoisted(() => ({
  updateSettings: vi.fn(),
  resetMockData: vi.fn(),
  setLocale: vi.fn(),
}));
vi.mock("@/adapters/adapter-factory", () => ({ getSettingsPort: () => ports, getLocalePort: () => ports }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { resetSettingsAction, updateSettingsAction } from "./actions";

describe("settings server actions", () => {
  it("normalizes form values and updates settings and locale", async () => {
    const form = new FormData();
    form.set("locale", "en"); form.append("activeLevels", "B1"); form.append("activeLevels", "B2"); form.set("dailyGoal", "99"); form.set("reducedMotion", "on");
    await updateSettingsAction(form);
    expect(ports.updateSettings).toHaveBeenCalledWith({ locale: "en", activeLevels: ["B1", "B2"], dailyGoal: 20, reducedMotion: true });
    expect(ports.setLocale).toHaveBeenCalledWith("en");
  });

  it("resets mock settings and locale to Spanish", async () => {
    await resetSettingsAction();
    expect(ports.resetMockData).toHaveBeenCalledOnce();
    expect(ports.setLocale).toHaveBeenCalledWith("es");
  });
});
