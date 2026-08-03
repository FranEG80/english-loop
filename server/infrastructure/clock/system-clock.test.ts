// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SystemClock } from "./system-clock";

describe("SystemClock", () => {
  it("returns a real Date and an ISO representation", () => {
    const clock = new SystemClock();
    expect(clock.now()).toBeInstanceOf(Date);
    expect(clock.nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/iu);
  });
});
