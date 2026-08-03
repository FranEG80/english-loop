export type CefrLevel = "B1" | "B2";

/** Filtro de nivel: un nivel concreto o ambos a la vez. */
export type CefrLevelFilter = CefrLevel | "both";

export const CEFR_LEVELS: readonly CefrLevel[] = ["B1", "B2"];

export function isCefrLevel(value: string): value is CefrLevel {
  return value === "B1" || value === "B2";
}

export function isCefrLevelFilter(value: string): value is CefrLevelFilter {
  return value === "B1" || value === "B2" || value === "both";
}
