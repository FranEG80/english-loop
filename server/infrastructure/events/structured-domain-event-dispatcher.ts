import "server-only";
import type { DomainEventDispatcherPort, DomainEvent, LoggerPort } from "@/core/shared/kernel";

/**
 * Dispatcher inicial de eventos internos. Los publica en el logger
 * estructurado hasta que exista una proyección o un bus de eventos propio.
 */
export class StructuredDomainEventDispatcher
  implements DomainEventDispatcherPort
{
  constructor(private readonly logger: LoggerPort) {}

  async dispatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.logger.info({
        message: "Domain event published",
        context: "domain-events",
        metadata: {
          eventName: event.eventName,
          aggregateId: event.aggregateId,
          occurredAt: event.occurredAt,
        },
      });
    }
  }
}
