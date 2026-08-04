import type { D1Result } from "../types/binding";

export type Row = Record<string, unknown>;

export function rows<T extends Row>(result: D1Result): T[] {
  return result.results as T[];
}

export function first<T extends Row>(result: D1Result): T | null {
  return rows<T>(result)[0] ?? null;
}

export function bool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export function text(value: unknown): string {
  return String(value ?? "");
}

export function nullableText(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

export function iso(value: unknown): string {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? text(value) : parsed.toISOString();
}
