/**
 * El contenido guarda un único marcador de hueco, `[gapN]`. Cómo se ve depende
 * de la presentación:
 *
 * - en `gap_fill` cada hueco es un campo de escritura, y de eso se encarga
 *   `GapFillRenderer` a partir de los segmentos;
 * - en una pregunta de opción, en una carta del mazo o en una ronda de un
 *   minijuego no hay nada que escribir, así que el hueco es solo una raya.
 *
 * Esta función cubre el segundo caso. Sin ella el alumno leería «I decided to
 * [gap1] today», que es un detalle interno del formato.
 */

const GAP_MARKER = /\[gap\d+\]/g;
/** Raya de longitud fija: no insinúa cuántas palabras caben. */
const BLANK = "____";

export function withVisibleGaps(text: string): string {
  return text.replace(GAP_MARKER, BLANK);
}
