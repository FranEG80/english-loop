import type { NormalizationRules } from "./types";

const CURLY_APOSTROPHES = /[\u2018\u2019\u02bc]/g;
const TERMINAL_PUNCTUATION = /[.!?]+$/u;

export function normalizeText(
  value: string,
  rules: NormalizationRules,
): string {
  let result = value.normalize("NFC");

  if (rules.normaliseApostrophes) result = result.replace(CURLY_APOSTROPHES, "'");
  if (rules.trim) result = result.trim();
  if (rules.collapseWhitespace) result = result.replace(/\s+/gu, " ");
  if (rules.ignoreTerminalPunctuation) {
    result = result.replace(TERMINAL_PUNCTUATION, "");
  }
  if (!rules.caseSensitive) result = result.toLocaleLowerCase("en-GB");

  return result;
}

export function normalizePrompt(value: string): string {
  return value
    .normalize("NFC")
    .replace(CURLY_APOSTROPHES, "'")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-GB");
}
