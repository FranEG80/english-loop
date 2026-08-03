import { DomainException } from "./domain-exception";

/** No hay suficientes actividades para satisfacer el alcance solicitado. */
export class InsufficientActivitiesForScopeException extends DomainException {
  readonly code = "INSUFFICIENT_ACTIVITIES_FOR_SCOPE";
}
