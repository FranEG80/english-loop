import { DomainException } from "./domain-exception";

/** Se viola una invariante del dominio. */
export class InvariantViolationException extends DomainException {
  readonly code = "INVARIANT_VIOLATION";
}
