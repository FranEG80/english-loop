import { describe, expect, it } from "vitest";
import { mockCanvasPreview } from "./canvas-preview";
import { mockFlashcardStack } from "./flashcards";

describe("mock content fixtures", () => {
  it("provides a localized canvas preview", () => {
    expect(mockCanvasPreview.id).toBe("canvas-preview-sentence-mapping");
    expect(mockCanvasPreview.title.en).toContain("sentence");
    expect(mockCanvasPreview.title.es).toContain("frases");
    expect(mockCanvasPreview.previewImageSrc).toMatch(/^\//);
  });

  it("provides a complete flashcard stack with stable ids", () => {
    expect(mockFlashcardStack.cards.length).toBeGreaterThan(0);
    expect(new Set(mockFlashcardStack.cards.map((card) => card.id)).size)
      .toBe(mockFlashcardStack.cards.length);
    expect(mockFlashcardStack.cards[0]).toMatchObject({ front: "get up", back: "levantarse" });
  });
});
