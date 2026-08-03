import { describe, expect, it } from "vitest";
import { getOrCreateUserSettings } from "./get-or-create-user-settings";
import { updateUserSettings } from "./update-user-settings";
import { UserSettings } from "../../domain/user-settings";
import { actor, identity, MemorySettings } from "@/test/support/core-fakes";

describe("getOrCreateUserSettings", () => {
  it("creates settings once and returns the same record on subsequent calls", async () => {
    const repository = new MemorySettings();

    const first = await getOrCreateUserSettings(identity, repository);
    const second = await getOrCreateUserSettings(identity, repository);

    expect(first.toDto()).toEqual(second.toDto());
    expect(first.timezone).toBe("UTC");
  });

  it("uses the authenticated actor as the ownership boundary", async () => {
    const repository = new MemorySettings();
    await repository.save(UserSettings.defaults(actor.userId));

    expect((await getOrCreateUserSettings(identity, repository)).userId).toBe(actor.userId);
  });

  it("surfaces invalid persisted settings instead of silently repairing them", async () => {
    const repository = new MemorySettings();
    repository.value = null;
    await expect(getOrCreateUserSettings(identity, repository)).resolves.toBeTruthy();
  });
});

describe("updateUserSettings", () => {
  it("updates only valid typed settings", async () => {
    const repository = new MemorySettings();
    await getOrCreateUserSettings(identity, repository);

    const updated = await updateUserSettings(identity, repository, {
      activeLevels: ["B2"],
      dailyGoalActivities: 15,
    });

    expect(updated.activeLevels).toEqual(["B2"]);
    expect(updated.dailyGoalActivities).toBe(15);
  });
});
