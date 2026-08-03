import { ApplicationException } from "./application-exception";

/** El actor no tiene permiso para la operación. */
export class ForbiddenException extends ApplicationException {
  readonly code = "FORBIDDEN";
}
