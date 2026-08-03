import { InfrastructureException } from "./infrastructure-exception";

/** El dataset no está disponible o es incompatible. */
export class DatasetUnavailableException extends InfrastructureException {
  readonly code = "DATASET_UNAVAILABLE";
}
