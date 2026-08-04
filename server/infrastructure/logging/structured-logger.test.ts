// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { sanitizeMetadata, StructuredLogger } from "./structured-logger";

describe("structured logger", () => {
  it("removes sensitive nested metadata", () => {
    expect(sanitizeMetadata({ requestId: "r", password: "secret", nested: { answer: "42", ok: true }, list: [{ cookie: "hidden", value: 1 }, null, "text"], empty: null })).toEqual({ requestId: "r", nested: { ok: true }, list: [{ value: 1 }, null, "text"], empty: null });
  });

  it("uses the clock and writes structured JSON", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = new StructuredLogger({ nowIso: () => "2026-08-03T00:00:00.000Z", now: () => new Date("2026-08-03T00:00:00.000Z") });
    logger.info({ message: "ok", metadata: { token: "hidden", requestId: "r" } });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('"requestId":"r"'));
    expect(log.mock.calls[0]?.[0]).not.toContain("hidden");
    log.mockRestore();
  });

  it("writes every non-error level and routes errors to stderr", () => {
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = new StructuredLogger({ nowIso: () => "now", now: () => new Date(0) });
    const entry = { message: "message", metadata: { value: 1 } };
    logger.debug(entry);
    logger.info(entry);
    logger.warn(entry);
    logger.error(entry);
    expect(output).toHaveBeenCalledTimes(3);
    expect(errors).toHaveBeenCalledTimes(1);
    expect(errors.mock.calls[0]?.[0]).toContain('"level":"error"');
    output.mockRestore();
    errors.mockRestore();
  });
});
