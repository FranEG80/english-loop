import type { DomainEvent } from "@/core/shared/kernel";

export class DailySessionStarted implements DomainEvent {
  readonly eventName = "DailySessionStarted";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly date: string,
  ) {}
}

export class LessonCompleted implements DomainEvent {
  readonly eventName = "LessonCompleted";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly lessonId: string,
  ) {}
}

export class LessonSkipped implements DomainEvent {
  readonly eventName = "LessonSkipped";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly lessonId: string,
  ) {}
}

export class DailyPracticeStarted implements DomainEvent {
  readonly eventName = "DailyPracticeStarted";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly practiceRunId: string,
  ) {}
}

export class DailySessionCompleted implements DomainEvent {
  readonly eventName = "DailySessionCompleted";
  constructor(
    readonly aggregateId: string,
    readonly occurredAt: string,
    readonly userId: string,
    readonly date: string,
  ) {}
}
