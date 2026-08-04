import type { D1Operation } from "../types/operations";

export function operation<T extends D1Operation>(value: T): T {
  return value;
}
