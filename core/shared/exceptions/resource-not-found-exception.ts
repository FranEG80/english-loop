import { ApplicationException } from "./application-exception";

/** Recurso solicitado que no existe. */
export class ResourceNotFoundException extends ApplicationException {
  readonly code = "RESOURCE_NOT_FOUND";
}
