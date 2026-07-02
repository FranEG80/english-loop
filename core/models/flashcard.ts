import type { CefrLevel } from "./level";

export interface FlashcardCardDto {
  id: string;
  /** Palabra o expresión en inglés. */
  front: string;
  /** Significado o traducción en español. */
  back: string;
}

/**
 * Pila de estudio/revisión. No es una actividad puntuable: el usuario solo
 * revela contenido y navega, no se autoevalúa como acierto/fallo.
 */
export interface FlashcardStackDto {
  id: string;
  title: string;
  level: CefrLevel;
  taxonomyNodeId: string;
  cards: FlashcardCardDto[];
}
