import { ApplicationException } from "./application-exception";

/** El actor no está autenticado. */
export class UnauthorizedException extends ApplicationException {
  readonly code = "UNAUTHORIZED";
}
