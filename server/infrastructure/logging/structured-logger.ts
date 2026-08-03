import "server-only";
import type { ClockPort, LoggerPort, LogEntry } from "@/core/shared/kernel";

/**
 * Logger estructurado que emite JSON a stdout. Nunca registra passwords,
 * cookies, respuestas correctas ni snapshots de evaluación.
 */
export class StructuredLogger implements LoggerPort {
  constructor(private readonly clock: ClockPort) {}

  private write(entry: LogEntry): void {
    const line = JSON.stringify({
      timestamp: this.clock.nowIso(),
      ...entry,
      metadata: entry.metadata ? sanitizeMetadata(entry.metadata) : undefined,
    });
    if (entry.level === "error") {
      console.error(line);
    } else {
      console.log(line);
    }
  }

  debug(entry: Omit<LogEntry, "level">): void {
    this.write({ ...entry, level: "debug" });
  }

  info(entry: Omit<LogEntry, "level">): void {
    this.write({ ...entry, level: "info" });
  }

  warn(entry: Omit<LogEntry, "level">): void {
    this.write({ ...entry, level: "warn" });
  }

  error(entry: Omit<LogEntry, "level">): void {
    this.write({ ...entry, level: "error" });
  }
}

const SENSITIVE_KEYS = /password|secret|token|cookie|authorization|response|answer/i;

export function sanitizeMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.test(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item && typeof item === "object"
          ? sanitizeMetadata(item as Record<string, unknown>)
          : item,
      );
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
