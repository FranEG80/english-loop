import type { LessonExample } from "./types/lesson";

export type LessonContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level: number }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface LessonContentSection {
  title: string;
  blocks: LessonContentBlock[];
}

export interface ParsedLessonMarkdown {
  summary: string;
  sections: LessonContentSection[];
  examples: LessonExample[];
  commonMistakes: string[];
}

function normaliseHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/^\*\*(.+)\*\*$/, "$1")
    .replace(/^\*(.+)\*$/, "$1")
    .replace(/^`(.+)`$/, "$1")
    .trim();
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseBlocks(lines: string[]): LessonContentBlock[] {
  const blocks: LessonContentBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";
    if (!line) {
      index += 1;
      continue;
    }
    const heading = /^(#{2,6})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index]?.trim() ?? "")) {
        items.push((lines[index]?.trim() ?? "").replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const current = lines[index]?.trim() ?? "";
        const item = /^\d+\.\s+(.+)$/.exec(current);
        if (!item) break;
        let text = item[1];
        index += 1;
        while (
          index < lines.length &&
          /^\s{2,}[-*]\s+/.test(lines[index] ?? "")
        ) {
          text += ` · ${(lines[index] ?? "").trim().replace(/^[-*]\s+/, "")}`;
          index += 1;
        }
        items.push(text);
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }
    if (
      line.startsWith("|") &&
      index + 1 < lines.length &&
      /^\|?\s*:?-+/.test(lines[index + 1]?.trim() ?? "")
    ) {
      const headers = splitTableRow(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && (lines[index]?.trim() ?? "").startsWith("|")) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index]?.trim() ?? "";
      if (!next || /^(#{2,6})\s+/.test(next) || /^[-*]\s+/.test(next) || /^\d+\.\s+/.test(next) || next.startsWith("|")) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}

function plainText(blocks: LessonContentBlock[]): string {
  return blocks
    .flatMap((block) => {
      if (block.type === "paragraph" || block.type === "heading") return [block.text];
      if (block.type === "table") return [...block.headers, ...block.rows.flat()];
      return block.items;
    })
    .join(" ")
    .trim();
}

function listItems(section?: LessonContentSection): string[] {
  if (!section) return [];
  return section.blocks.flatMap((block) =>
    block.type === "ordered-list" || block.type === "unordered-list"
      ? block.items
      : [],
  );
}

export function parseLessonMarkdown(markdown: string): ParsedLessonMarkdown {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const rawSections: Array<{ title: string; lines: string[] }> = [];
  let current = { title: "", lines: [] as string[] };
  for (const line of lines) {
    const heading = /^#\s+(.+)$/.exec(line.trim());
    if (heading) {
      if (current.title || current.lines.some((item) => item.trim())) rawSections.push(current);
      current = { title: heading[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.title || current.lines.some((item) => item.trim())) rawSections.push(current);

  const parsedSections = rawSections.map((section) => ({
    title: section.title,
    blocks: parseBlocks(section.lines),
  }));
  const summarySection = parsedSections.find((section) =>
    ["resumen", "summary"].includes(normaliseHeading(section.title)),
  );
  const examplesSection = parsedSections.find((section) =>
    ["ejemplos", "examples"].includes(normaliseHeading(section.title)),
  );
  const mistakesSection = parsedSections.find((section) =>
    ["errores frecuentes", "common mistakes"].includes(normaliseHeading(section.title)),
  );
  const examples = listItems(examplesSection).map((item) => {
    const separator = item.match(/\s+[—–-]\s+/);
    if (!separator || separator.index === undefined) {
      return { english: stripInlineMarkdown(item), translationEs: "" };
    }
    return {
      english: stripInlineMarkdown(item.slice(0, separator.index)),
      translationEs: stripInlineMarkdown(item.slice(separator.index + separator[0].length)),
    };
  });
  const excluded = new Set([summarySection, examplesSection, mistakesSection]);
  const sections = parsedSections.filter(
    (section) => !excluded.has(section) && section.blocks.length > 0,
  );
  return {
    summary: summarySection ? plainText(summarySection.blocks) : "",
    sections,
    examples,
    commonMistakes: listItems(mistakesSection).map(stripInlineMarkdown),
  };
}
