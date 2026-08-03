import { ApplicationException } from "./application-exception";

/** Error de validación de entrada (422). */
export class ValidationException extends ApplicationException {
  readonly code = "VALIDATION_ERROR";
  readonly fieldErrors: Readonly<Record<string, string[]>>;

  constructor(
    message: string,
    fieldErrors: Record<string, string[]> = {},
    publicMessage?: string,
  ) {
    super(message, publicMessage ?? message);
    this.fieldErrors = fieldErrors;
  }
}
