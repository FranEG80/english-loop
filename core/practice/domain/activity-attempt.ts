import type { ActivityResponseValue } from "@/core/models/types/attempt";

export type AttemptOrigin = "DAILY" | "SMART_REVIEW" | "FOCUSED";

export interface ActivityAttemptProps {
  id: string;
  userId: string;
  practiceRunId: string | null;
  activityId: string;
  activityVersionId?: string | null;
  practiceRunItemId?: string | null;
  origin: AttemptOrigin;
  idempotencyKey: string;
  response: ActivityResponseValue;
  isCorrect: boolean;
  isRepetition?: boolean;
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

  get activityVersionId(): string | null {
    return this.props.activityVersionId ?? null;
  }

  get practiceRunItemId(): string | null {
    return this.props.practiceRunItemId ?? null;
  }

  get isRepetition(): boolean {
    return this.props.isRepetition ?? false;
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
