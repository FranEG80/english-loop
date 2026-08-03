import { describe, expect, it, vi } from "vitest";

const root = vi.hoisted(() => ({ identity: {}, userSettingsRepository: {} }));
const update = vi.hoisted(() => vi.fn(async () => ({ userId: "u" })));
vi.mock("@/server/infrastructure/composition/composition-root", () => ({ compositionRoot: root }));
vi.mock("@/core/account/application/use-cases/update-user-settings", () => ({ updateUserSettings: update }));
vi.mock("@/core/account/application/mappers/user-settings-mapper", () => ({ toUserSettingsDto: (value: unknown) => ({ mapped: value }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateSettingsAction } from "./settings";

describe("app settings action", () => {
  it("updates settings and maps the result", async () => {
    await expect(updateSettingsAction({ locale: "en", activeLevels: ["B2"], dailyGoalActivities: 15 })).resolves.toEqual({ mapped: { userId: "u" } });
    expect(update).toHaveBeenCalledWith(root.identity, root.userSettingsRepository, { locale: "en", activeLevels: ["B2"], dailyGoalActivities: 15 });
  });
});
