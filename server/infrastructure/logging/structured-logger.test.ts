// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { sanitizeMetadata, StructuredLogger } from "./structured-logger";

describe("structured logger", () => {
  it("removes sensitive nested metadata", () => {
    expect(sanitizeMetadata({ requestId: "r", password: "secret", nested: { answer: "42", ok: true } })).toEqual({ requestId: "r", nested: { ok: true } });
  });

  it("uses the clock and writes structured JSON", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new StructuredLogger({ nowIso: () => "2026-08-03T00:00:00.000Z", now: () => new Date("2026-08-03T00:00:00.000Z") });
    logger.info({ message: "ok", metadata: { token: "hidden", requestId: "r" } });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"requestId":"r"'));
    expect(log.mock.calls[0]?.[0]).not.toContain("hidden");
    log.mockRestore();
  });
});
