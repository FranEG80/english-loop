/**
 * Base para entidades del dominio. Una entidad tiene identidad propia y
 * continuidad a lo largo del tiempo, independientemente de sus atributos.
 */
export abstract class Entity<TId> {
  protected readonly _id: TId;

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    if (this.constructor !== other.constructor) return false;
    return this._id === other._id;
  }
}
