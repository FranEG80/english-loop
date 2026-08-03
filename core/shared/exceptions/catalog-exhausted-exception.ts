import { DomainException } from "./domain-exception";

/** El catálogo se ha agotado: no queda contenido elegible. */
export class CatalogExhaustedException extends DomainException {
  readonly code = "CATALOG_EXHAUSTED";
}
