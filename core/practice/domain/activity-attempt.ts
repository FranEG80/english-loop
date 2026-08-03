import type { ActivityResponseValue } from "@/core/models/attempt";

export type AttemptOrigin = "DAILY" | "SMART_REVIEW" | "FOCUSED";

export interface ActivityAttemptProps {
  id: string;
  userId: string;
  practiceRunId: string | null;
  activityId: string;
  origin: AttemptOrigin;
  idempotencyKey: string;
  response: ActivityResponseValue;
  isCorrect: boolean;
  evaluatorVersion: string;
  submittedAt: string;
}

/**
 * Un intento es inmutable y auditable. Una vez creado no puede modificarse
 * ni borrarse.
 */
export class ActivityAttempt {
  private constructor(private readonly props: ActivityAttemptProps) {}

  static create(props: ActivityAttemptProps): ActivityAttempt {
    return new ActivityAttempt({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get practiceRunId(): string | null {
    return this.props.practiceRunId;
  }

  get activityId(): string {
    return this.props.activityId;
  }

  get origin(): AttemptOrigin {
    return this.props.origin;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get response(): ActivityResponseValue {
    return this.props.response;
  }

  get isCorrect(): boolean {
    return this.props.isCorrect;
  }

  get evaluatorVersion(): string {
    return this.props.evaluatorVersion;
  }

  get submittedAt(): string {
    return this.props.submittedAt;
  }
}
