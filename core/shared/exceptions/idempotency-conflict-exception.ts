import { ApplicationException } from "./application-exception";

/** La misma idempotency key se reutilizó con un payload distinto. */
export class IdempotencyConflictException extends ApplicationException {
  readonly code = "IDEMPOTENCY_CONFLICT";
}
