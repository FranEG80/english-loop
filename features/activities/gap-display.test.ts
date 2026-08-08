import { describe, expect, it } from "vitest";
import { withVisibleGaps } from "./gap-display";

describe("withVisibleGaps", () => {
  it("pinta el marcador como una raya", () => {
    expect(withVisibleGaps("I finally decided to [gap1] today.")).toBe(
      "I finally decided to ____ today.",
    );
  });

  it("sustituye todos los huecos, no solo el primero", () => {
    expect(withVisibleGaps("[gap1] and [gap2] and [gap3]")).toBe("____ and ____ and ____");
  });

  it("no toca un texto sin huecos", () => {
    expect(withVisibleGaps("The sun rises in the east.")).toBe(
      "The sun rises in the east.",
    );
  });

  // La expresión lleva `g`, que guarda `lastIndex` entre llamadas: sin cuidado,
  // la segunda invocación se saltaría el primer hueco.
  it("da el mismo resultado en llamadas seguidas", () => {
    const text = "We should [gap1] before [gap2].";

    expect(withVisibleGaps(text)).toBe(withVisibleGaps(text));
  });
});
