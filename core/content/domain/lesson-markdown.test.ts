import { describe, expect, it } from "vitest";
import { parseLessonMarkdown } from "./lesson-markdown";

const markdown = `# Resumen
Una explicación breve.

# Explicación
Usa \`be + participle\` y conserva el tiempo.

# Ejemplos
1. **Someone stole it. → It was stolen.** — Fue robado.

# Errores frecuentes
- ❌ *It was stole.*
- ✅ *It was stolen.*

# Mini resumen
1. Conserva el significado.
2. Comprueba el tiempo.`;

describe("parseLessonMarkdown", () => {
  it("extracts structured examples, mistakes and readable sections", () => {
    expect(parseLessonMarkdown(markdown)).toMatchObject({
      summary: "Una explicación breve.",
      examples: [{ english: "Someone stole it. → It was stolen.", translationEs: "Fue robado." }],
      commonMistakes: ["❌ *It was stole.*", "✅ *It was stolen.*"],
      sections: [
        { title: "Explicación", blocks: [{ type: "paragraph" }] },
        { title: "Mini resumen", blocks: [{ type: "ordered-list" }] },
      ],
    });
  });

  it("keeps plain content usable when headings are absent", () => {
    expect(parseLessonMarkdown("Plain explanation").sections).toEqual([
      { title: "", blocks: [{ type: "paragraph", text: "Plain explanation" }] },
    ]);
  });
});
