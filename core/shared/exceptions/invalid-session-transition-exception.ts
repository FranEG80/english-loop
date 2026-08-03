import { DomainException } from "./domain-exception";

/** Transición de estado de sesión no permitida. */
export class InvalidSessionTransitionException extends DomainException {
  readonly code = "INVALID_SESSION_TRANSITION";
}
