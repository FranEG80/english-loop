/**
 * Base de las excepciones de infraestructura. Representan fallos técnicos
 * (BD, red, dataset, proveedores externos). Nunca deben exponer detalles
 * internos al cliente.
 */
export abstract class InfrastructureException extends Error {
  abstract readonly code: string;
  readonly publicMessage: string;
  readonly metadata: Readonly<Record<string, unknown>>;

  constructor(message: string, publicMessage?: string, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
    this.publicMessage = publicMessage ?? "Internal server error";
    this.metadata = metadata;
  }
}
