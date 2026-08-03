import type { DomainEvent } from "./domain-event";

/** Publica eventos internos únicamente después de confirmar la transacción. */
export interface DomainEventDispatcherPort {
  dispatch(events: DomainEvent[]): Promise<void>;
}
