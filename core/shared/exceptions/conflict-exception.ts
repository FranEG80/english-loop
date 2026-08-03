import { ApplicationException } from "./application-exception";

/** Conflicto de estado (p. ej. sesión ya completada). */
export class ConflictException extends ApplicationException {
  readonly code = "CONFLICT";
}
