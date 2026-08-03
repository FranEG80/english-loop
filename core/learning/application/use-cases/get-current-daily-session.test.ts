import { describe, expect, it } from "vitest";
import { clock, identity, makeDailySession, MemorySessions } from "@/test/support/core-fakes";
import { getCurrentDailySession } from "./get-current-daily-session";

describe("getCurrentDailySession", () => {
  it("looks up the session by actor and local date", async () => {
    const repository = new MemorySessions();
    const session = makeDailySession("current", "lesson");
    await repository.save(session);
    expect(await getCurrentDailySession(identity, repository, session.date)).toBe(session);
    expect(await getCurrentDailySession(identity, repository, "2099-01-01")).toBeNull();
    expect(clock.nowIso()).toBeTypeOf("string");
  });
});
