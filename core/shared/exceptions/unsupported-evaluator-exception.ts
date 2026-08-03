import { DomainException } from "./domain-exception";

/** El evaluador solicitado no está soportado. */
export class UnsupportedEvaluatorException extends DomainException {
  readonly code = "UNSUPPORTED_EVALUATOR";
}
