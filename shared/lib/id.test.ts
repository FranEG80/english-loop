import { describe, expect, it } from "vitest";
import { generateId } from "./id";

describe("generateId", () => {
  it("adds a prefix and produces unique non-empty identifiers", () => {
    const first = generateId("test");
    const second = generateId("test");
    expect(first).toMatch(/^test-/u);
    expect(first).not.toBe(second);
  });
});
