import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("flattens nested class values and ignores falsy values", () => {
    expect(cn("base", false, ["nested", ["deep", null]], undefined, 0, "last")).toBe("base nested deep last");
  });
});
