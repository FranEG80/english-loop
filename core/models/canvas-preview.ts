import type { LocalizedText } from "./locale";

/**
 * Demostración visual no puntuable. No se registra como actividad completada.
 */
export interface CanvasPreviewDto {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  previewImageSrc: string;
}
