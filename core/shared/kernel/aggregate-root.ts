import type { DomainEvent } from "./domain-event";

/**
 * Un aggregate root es una entidad que actúa como frontera de consistencia
 * transaccional. Es el único punto de entrada para modificar el agregado y
 * publica los eventos de dominio que produce.
 */
export abstract class AggregateRoot<TId> {
  protected readonly _id: TId;
  private readonly _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    this._id = id;
  }

  get id(): TId {
    return this._id;
  }

  protected recordEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents.length = 0;
    return events;
  }
}
