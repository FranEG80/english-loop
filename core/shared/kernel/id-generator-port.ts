/**
 * Generador de identificadores. Permite intercambiar la implementación
 * (UUID v4, ULID, etc.) sin tocar el dominio.
 */
export interface IdGeneratorPort {
  generate(): string;
}
