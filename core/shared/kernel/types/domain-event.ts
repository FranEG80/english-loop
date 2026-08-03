/**
 * Un evento de dominio describe algo que ya ocurrió dentro del dominio.
 * Es inmutable y se expresa en pasado.
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: string;
  readonly aggregateId: string;
}
