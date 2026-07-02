import type { CanvasPreviewDto } from "@/core/models";

export const mockCanvasPreview: CanvasPreviewDto = {
  id: "canvas-preview-sentence-mapping",
  title: {
    es: "Mapa visual de frases (demo)",
    en: "Visual sentence mapping (demo)",
  },
  description: {
    es: "Una demostración visual para explorar cómo se conectan las partes de una frase. No puntúa ni se guarda como actividad completada.",
    en: "A visual demo to explore how the parts of a sentence connect. It is not graded and is never saved as a completed activity.",
  },
  previewImageSrc: "/illustrations/grammar-practice.webp",
};
