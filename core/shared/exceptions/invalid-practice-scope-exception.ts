import { DomainException } from "./domain-exception";

/** El alcance de práctica solicitado no es válido. */
export class InvalidPracticeScopeException extends DomainException {
  readonly code = "INVALID_PRACTICE_SCOPE";
}
