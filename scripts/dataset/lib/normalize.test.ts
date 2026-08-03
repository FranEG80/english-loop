import { describe, expect, it } from "vitest";
import { normalizePrompt, normalizeText } from "./normalize";

describe("dataset normalization", () => {
  it("normalizes Unicode apostrophes, whitespace, case and punctuation", () => {
    expect(normalizePrompt("  I\u2019m   ready  ")).toBe("i'm ready");
    expect(normalizeText("  I\u2019m   READY!!! ", {
      trim: true,
      collapseWhitespace: true,
      caseSensitive: false,
      ignoreTerminalPunctuation: true,
      normaliseApostrophes: true,
    })).toBe("i'm ready");
  });

  it("preserves configured case and terminal punctuation", () => {
    expect(normalizeText("  Hello!  ", {
      trim: true,
      collapseWhitespace: true,
      caseSensitive: true,
      ignoreTerminalPunctuation: false,
      normaliseApostrophes: false,
    })).toBe("Hello!");
  });
});
