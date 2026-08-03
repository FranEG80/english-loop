/**
 * Base de las excepciones de la capa de aplicación. Representan errores
 * relacionados con el flujo de un caso de uso, no con invariantes del dominio.
 */
export abstract class ApplicationException extends Error {
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
