import { InfrastructureException } from "./infrastructure-exception";

/** Una respuesta del servidor excede el límite HTTP configurado. */
export class ResponsePayloadTooLargeException extends InfrastructureException {
  readonly code = "RESPONSE_BODY_TOO_LARGE";

  constructor(limitBytes: number) {
    super(
      `Response body exceeds the configured limit of ${limitBytes} bytes`,
      "The server response is too large.",
    );
  }
}
