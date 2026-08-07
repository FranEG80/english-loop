import type { ActivitySegment } from "@/core/models/types/activity";

const GAP_MARKER = /\[(gap\d+)\]/g;
/** Prefijo de turno de diálogo: `A:`, `Colleague:`, `Office manager:`. */
const SPEAKER_PREFIX = /^([A-Z][A-Za-z ]{0,15}):\s+/;

/**
 * Convierte un texto con marcadores `[gapN]` en segmentos listos para pintar
 * huecos en línea. Los saltos de línea se conservan como `break` y los
 * prefijos de turno como `speaker`, para que un diálogo se lea como diálogo
 * sin necesidad de una estructura aparte.
 *
 * `position` numera los huecos desde 1 en orden de aparición, que es lo que
 * ve el alumno en la etiqueta «Hueco N de M».
 */
export function parseGapSegments(text: string): ActivitySegment[] {
  const segments: ActivitySegment[] = [];
  let gapPosition = 0;

  const lines = text.split("\n");
  for (const [lineIndex, rawLine] of lines.entries()) {
    if (lineIndex > 0) segments.push({ kind: "break" });

    let line = rawLine;
    const speaker = line.match(SPEAKER_PREFIX);
    if (speaker) {
      segments.push({ kind: "speaker", label: speaker[1]! });
      line = line.slice(speaker[0].length);
    }

    GAP_MARKER.lastIndex = 0;
    let cursor = 0;
    for (const match of line.matchAll(GAP_MARKER)) {
      const start = match.index ?? 0;
      if (start > cursor) {
        segments.push({ kind: "text", value: line.slice(cursor, start) });
      }
      gapPosition += 1;
      segments.push({ kind: "gap", gapId: match[1]!, position: gapPosition });
      cursor = start + match[0].length;
    }
    if (cursor < line.length) {
      segments.push({ kind: "text", value: line.slice(cursor) });
    }
  }

  return segments;
}

/** Ids de hueco en orden de aparición. */
export function gapIdsOf(segments: readonly ActivitySegment[]): string[] {
  return segments
    .filter((segment): segment is Extract<ActivitySegment, { kind: "gap" }> =>
      segment.kind === "gap",
    )
    .map((segment) => segment.gapId);
}
