/**
 * Un value object es inmutable y se identifica por el valor de sus atributos,
 * no por una identidad propia. Dos value objects son iguales si todos sus
 * atributos son iguales.
 */
export abstract class ValueObject<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<TProps> | null | undefined): boolean {
    if (other === null || other === undefined) return false;
    if (this.constructor !== other.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
