import type { DomainEvent } from "@/core/shared/kernel";

export class ActivityAnswered implements DomainEvent {
  readonly eventName = "ActivityAnswered";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly activityId: string,
    readonly isCorrect: boolean,
  ) {}
}

export class ActivityFailed implements DomainEvent {
  readonly eventName = "ActivityFailed";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly activityId: string,
  ) {}
}
