export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  /** Nombre del caso de uso o módulo. */
  context?: string;
  /** Duración en ms. */
  durationMs?: number;
  /** Código de error estable. */
  errorCode?: string;
  /** Metadatos seguros (nunca secretos, cookies ni respuestas correctas). */
  metadata?: Record<string, unknown>;
}

/** Logger estructurado. El core depende de este puerto, no de console. */
export interface LoggerPort {
  debug(entry: Omit<LogEntry, "level">): void;
  info(entry: Omit<LogEntry, "level">): void;
  warn(entry: Omit<LogEntry, "level">): void;
  error(entry: Omit<LogEntry, "level">): void;
}
