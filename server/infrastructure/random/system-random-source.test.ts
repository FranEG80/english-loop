// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SystemRandomSource } from "./system-random-source";

describe("SystemRandomSource", () => {
  it("keeps int and float within bounds and shuffle preserves membership", () => {
    const random = new SystemRandomSource();
    expect(random.int(5)).toBeGreaterThanOrEqual(0);
    expect(random.int(5)).toBeLessThan(5);
    expect(random.float()).toBeGreaterThanOrEqual(0);
    expect(random.float()).toBeLessThan(1);
    expect(random.shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3]);
  });
});
