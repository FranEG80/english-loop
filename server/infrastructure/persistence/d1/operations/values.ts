import type { D1Value } from "../types/binding";

export function d1Value(value: unknown): D1Value {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof ArrayBuffer ||
    value instanceof Uint8Array
  ) {
    return value;
  }
  throw new TypeError("D1 parameters must be scalar values");
}
