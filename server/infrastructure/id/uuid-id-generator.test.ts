// @vitest-environment node
import { describe, expect, it } from "vitest";
import { UuidIdGenerator } from "./uuid-id-generator";

describe("UuidIdGenerator", () => {
  it("generates distinct UUID v4 identifiers", () => {
    const generator = new UuidIdGenerator();
    const first = generator.generate();
    const second = generator.generate();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu);
    expect(first).not.toBe(second);
  });
});
