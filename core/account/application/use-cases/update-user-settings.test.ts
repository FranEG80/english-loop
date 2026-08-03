import { describe, expect, it } from "vitest";
import { getOrCreateUserSettings } from "./get-or-create-user-settings";
import { updateUserSettings } from "./update-user-settings";
import { identity, MemorySettings } from "@/test/support/core-fakes";

describe("updateUserSettings", () => {
  it("creates missing settings before applying the update", async () => {
    const repository = new MemorySettings();

    const updated = await updateUserSettings(identity, repository, {
      dailyGoalLessons: 2,
    });

    expect(updated.dailyGoalLessons).toBe(2);
    expect(await getOrCreateUserSettings(identity, repository)).toBe(updated);
  });

  it("updates levels and activity goal together", async () => {
    const repository = new MemorySettings();
    await getOrCreateUserSettings(identity, repository);

    const updated = await updateUserSettings(identity, repository, {
      activeLevels: ["B1", "B2"],
      dailyGoalActivities: 20,
    });

    expect(updated.activeLevels).toEqual(["B1", "B2"]);
    expect(updated.dailyGoalActivities).toBe(20);
  });
});
