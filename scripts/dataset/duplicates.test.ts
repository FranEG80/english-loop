import { describe, expect, it } from "vitest";
import type { Activity } from "./lib/types";
import { findDuplicates, visibleFingerprint } from "./duplicates";

function item(id: string, prompt: string, overrides: Partial<Activity> = {}): Activity {
  return {
    id,
    prompt,
    level: "B1",
    type: "true_false",
    topic: "topic",
    ...overrides,
  } as Activity;
}

describe("findDuplicates", () => {
  it("finds exact normalized groups and near duplicates deterministically", () => {
    const result = findDuplicates([
      item("b", "Hello world"),
      item("a", " hello   world "),
      item("c", "Hello world today"),
    ]);

    expect(result.exact).toEqual([
      { normalisedPrompt: "true_false | hello world", activityIds: ["a", "b"] },
    ]);
    expect(result.nearDuplicateThreshold).toBe(0.86);
    expect(result.near).toEqual([]);
  });

  it("no confunde dos tipos distintos que comparten la frase", () => {
    const result = findDuplicates([
      item("gap", "The results ___ be inaccurate.", { type: "gap_fill" }),
      item("choice", "The results ___ be inaccurate.", { type: "single_choice" }),
    ]);

    expect(result.exact).toEqual([]);
  });
});

describe("visibleFingerprint", () => {
  it("usa los fragmentos en word_order, no el prompt con la solución", () => {
    const fingerprint = visibleFingerprint(
      item("wo", "I saw a cat in the garden.", {
        type: "word_order",
        tokens: [
          { id: "t2", text: "a cat" },
          { id: "t1", text: "I saw" },
        ],
      }),
    );

    expect(fingerprint).toBe("word_order | a cat | i saw");
    expect(fingerprint).not.toContain("garden");
  });

  it("usa el texto con huecos y las opciones en los tipos con enunciado", () => {
    const fingerprint = visibleFingerprint(
      item("gap", "Complete the sentence.", {
        type: "gap_fill",
        gapText: "I booked a return [gap1] to Leeds.",
      }),
    );

    expect(fingerprint).toBe(
      "gap_fill | complete the sentence. | i booked a return [gap1] to leeds.",
    );
  });

  it("es estable frente al orden de los pares en matching", () => {
    const pairs = [
      { leftId: "l1", left: "rely on", rightId: "r1", right: "depend" },
      { leftId: "l2", left: "insist on", rightId: "r2", right: "demand" },
    ];

    expect(visibleFingerprint(item("m1", "x", { type: "matching", pairs }))).toBe(
      visibleFingerprint(item("m2", "y", { type: "matching", pairs: [...pairs].reverse() })),
    );
  });
});
