import { InfrastructureException } from "./infrastructure-exception";

/** Error de persistencia (BD). */
export class PersistenceException extends InfrastructureException {
  readonly code = "PERSISTENCE_ERROR";
}
