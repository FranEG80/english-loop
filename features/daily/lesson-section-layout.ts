import type {
  LessonContentBlock,
  LessonContentSection,
} from "@/core/content/domain/lesson-markdown";

export type LessonSectionPlacement = "full" | "left" | "right";

const LONG_SECTION_MIN_LENGTH = 480;
const LONG_SECTION_RATIO = 0.72;

function visibleLength(value: string): number {
  return value.replace(/[\*_`]/g, "").trim().length;
}

function blockLength(block: LessonContentBlock): number {
  if (block.type === "paragraph" || block.type === "heading") {
    return visibleLength(block.text) + (block.type === "heading" ? 24 : 0);
  }

  if (block.type === "unordered-list" || block.type === "ordered-list") {
    return block.items.reduce(
      (total, item) => total + visibleLength(item) + 18,
      0,
    );
  }

  return (
    visibleLength(block.headers.join(" ")) +
    block.rows.reduce(
      (total, row) => total + visibleLength(row.join(" ")) + 18,
      0,
    ) +
    36
  );
}

function sectionLength(section: LessonContentSection): number {
  return visibleLength(section.title) + section.blocks.reduce(
    (total, block) => total + blockLength(block),
    0,
  );
}

export function getLessonSectionPlacements(
  sections: LessonContentSection[],
): LessonSectionPlacement[] {
  if (sections.length === 0) return [];
  if (sections.length === 1) return ["full"];

  const lengths = sections.map(sectionLength);
  let longest = lengths[0] ?? 0;
  for (let index = 1; index < lengths.length; index += 1) {
    longest = Math.max(longest, lengths[index] ?? 0);
  }

  const placements: Array<LessonSectionPlacement | undefined> = lengths.map((length) =>
    length >= LONG_SECTION_MIN_LENGTH && length >= longest * LONG_SECTION_RATIO
      ? "full"
      : undefined,
  );

  let runStart = 0;
  while (runStart < placements.length) {
    if (placements[runStart] === "full") {
      runStart += 1;
      continue;
    }

    let runEnd = runStart;
    while (runEnd < placements.length && placements[runEnd] !== "full") {
      runEnd += 1;
    }

    const compactCount = runEnd - runStart;
    const pairedEnd = compactCount % 2 === 0 ? runEnd : runEnd - 1;
    if (pairedEnd > runStart) {
      placements[runStart] = "left";
      placements[runStart + 1] = "right";
      let leftLength = lengths[runStart] ?? 0;
      let rightLength = lengths[runStart + 1] ?? 0;
      const remaining = Array.from(
        { length: pairedEnd - runStart - 2 },
        (_, offset) => runStart + offset + 2,
      );
      remaining.sort(
        (first, second) => (lengths[second] ?? 0) - (lengths[first] ?? 0),
      );

      for (const index of remaining) {
        if (leftLength / 5 <= rightLength / 7) {
          placements[index] = "left";
          leftLength += lengths[index] ?? 0;
        } else {
          placements[index] = "right";
          rightLength += lengths[index] ?? 0;
        }
      }
    }

    if (pairedEnd < runEnd) placements[pairedEnd] = "full";
    runStart = runEnd;
  }

  return placements as LessonSectionPlacement[];
}
