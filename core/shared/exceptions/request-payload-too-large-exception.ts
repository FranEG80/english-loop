import { ApplicationException } from "./application-exception";

/** El cliente ha enviado un cuerpo mayor que el límite HTTP configurado. */
export class RequestPayloadTooLargeException extends ApplicationException {
  readonly code = "REQUEST_BODY_TOO_LARGE";

  constructor(limitBytes: number) {
    super(
      `Request body exceeds the configured limit of ${limitBytes} bytes`,
      "Request body is too large.",
    );
  }
}
