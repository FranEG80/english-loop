// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { StructuredDomainEventDispatcher } from "./structured-domain-event-dispatcher";

describe("StructuredDomainEventDispatcher", () => {
  it("publishes event metadata through the logger", async () => {
    const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const dispatcher = new StructuredDomainEventDispatcher(logger);
    await dispatcher.dispatch([{ eventName: "TestEvent", aggregateId: "aggregate", occurredAt: "now" } as never]);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ context: "domain-events", metadata: expect.objectContaining({ eventName: "TestEvent", aggregateId: "aggregate" }) }));
  });
});
