/**
 * Base de todas las excepciones del dominio. Cada excepción expone:
 * - `code`: código estable y programático (no cambia entre versiones).
 * - `message`: mensaje interno (para logs).
 * - `publicMessage`: mensaje seguro para el cliente.
 * - `metadata`: metadatos seguros adicionales.
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;
  readonly publicMessage: string;
  readonly metadata: Readonly<Record<string, unknown>>;

  constructor(message: string, publicMessage?: string, metadata: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
    this.publicMessage = publicMessage ?? message;
    this.metadata = metadata;
  }
}
