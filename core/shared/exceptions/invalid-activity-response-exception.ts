import { DomainException } from "./domain-exception";

/** La respuesta del usuario no es válida para la actividad. */
export class InvalidActivityResponseException extends DomainException {
  readonly code = "INVALID_ACTIVITY_RESPONSE";
}
