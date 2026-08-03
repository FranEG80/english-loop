import type { IdGeneratorPort } from "./id-generator-port";

/**
 * Identificador único generado por la aplicación. Se usa en lugar de
 * autoincrementales para que el core no dependa del proveedor de BD ni de
 * `node:crypto`.
 */
export class UniqueId {
  private constructor(readonly value: string) {}

  static create(idGenerator: IdGeneratorPort): UniqueId {
    return new UniqueId(idGenerator.generate());
  }

  static from(value: string): UniqueId {
    if (value.length === 0) {
      throw new Error("UniqueId cannot be empty");
    }
    return new UniqueId(value);
  }

  toString(): string {
    return this.value;
  }
}
