import type { CefrLevel } from "@/core/models/level";

export type ReviewStage = 0 | 1 | 2 | 3;

export interface ReviewItemProps {
  id: string;
  userId: string;
  activityId: string;
  taxonomyNodeId: string;
  level: CefrLevel;
  stage: ReviewStage;
  consecutiveCorrect: number;
  dueAt: string;
  failedAt: string;
  resolvedAt: string | null;
  attemptsCount: number;
}

/**
 * Entrada de repaso. Solo se crea tras un fallo y avanza por etapas con
 * aciertos consecutivos hasta resolverse.
 */
export class ReviewItem {
  private constructor(private readonly props: ReviewItemProps) {}

  static create(props: ReviewItemProps): ReviewItem {
    return new ReviewItem({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get activityId(): string {
    return this.props.activityId;
  }

  get taxonomyNodeId(): string {
    return this.props.taxonomyNodeId;
  }

  get level(): CefrLevel {
    return this.props.level;
  }

  get stage(): ReviewStage {
    return this.props.stage;
  }

  get consecutiveCorrect(): number {
    return this.props.consecutiveCorrect;
  }

  get dueAt(): string {
    return this.props.dueAt;
  }

  get failedAt(): string {
    return this.props.failedAt;
  }

  get resolvedAt(): string | null {
    return this.props.resolvedAt;
  }

  get attemptsCount(): number {
    return this.props.attemptsCount;
  }

  get isResolved(): boolean {
    return this.props.stage === 3;
  }

  toSnapshot(): ReviewItemProps {
    return { ...this.props };
  }
}
