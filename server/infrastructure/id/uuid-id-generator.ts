import "server-only";
import { randomUUID } from "node:crypto";
import type { IdGeneratorPort } from "@/core/shared/kernel";

/** Generador de identificadores UUID v4. */
export class UuidIdGenerator implements IdGeneratorPort {
  generate(): string {
    return randomUUID();
  }
}
