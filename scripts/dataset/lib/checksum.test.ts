import { describe, expect, it } from "vitest";
import { sha256Checksum } from "./checksum";
import { normalizeText, normalizePrompt } from "./normalize";

describe("dataset utility contracts", () => {
  it("produces deterministic SHA-256 checksums", () => {
    const value = { id: "activity-1", answers: ["a", "b"] };
    expect(sha256Checksum.checksum(value)).toBe(sha256Checksum.checksum(value));
    expect(sha256Checksum.checksum(value)).not.toBe(sha256Checksum.checksum({ ...value, id: "activity-2" }));
    expect(sha256Checksum.checksum(value)).toMatch(/^[a-f0-9]{64}$/u);
  });

  it("normalizes content according to explicit rules", () => {
    const rules = {
      trim: true,
      collapseWhitespace: true,
      caseSensitive: false,
      ignoreTerminalPunctuation: true,
      normaliseApostrophes: true,
    };
    expect(normalizeText("  I\u2019m   ready! ", rules)).toBe("i'm ready");
    expect(normalizePrompt("  Hello   WORLD  ")).toBe("hello world");
  });
});
