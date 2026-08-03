import { describe, expect, it } from "vitest";
import { clock, collectEvents, identity, makeDailySession, MemorySessions, uow } from "@/test/support/core-fakes";
import { completeDailySession } from "./complete-daily-session";
import { ResourceNotFoundException } from "@/core/shared/exceptions";

describe("completeDailySession", () => {
  it("completes a practice session and publishes its event", async () => {
    const repository = new MemorySessions();
    const session = makeDailySession("complete", "practice");
    await repository.save(session);
    const { events, dispatcher } = collectEvents();
    const result = await completeDailySession(identity, uow, repository, session.id, clock.nowIso(), dispatcher);
    expect(result.status).toBe("completed");
    expect(events.map((event) => event.eventName)).toContain("DailySessionCompleted");
    await expect(completeDailySession(identity, uow, repository, "missing", clock.nowIso(), dispatcher)).rejects.toBeInstanceOf(ResourceNotFoundException);
  });
});
