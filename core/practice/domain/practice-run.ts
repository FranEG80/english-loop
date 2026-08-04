import { AggregateRoot } from "@/core/shared/kernel";
import { InvariantViolationException } from "@/core/shared/exceptions";
import type { CefrLevelFilter } from "@/core/models/level";
import type { Activity } from "@/core/content/domain/types/activity";

export type PracticeRunMode = "DAILY" | "SMART_REVIEW" | "FOCUSED";
export type PracticeRunStatus = "in_progress" | "completed";

export interface PracticeScope {
  level: CefrLevelFilter;
  taxonomyNodeId: string;
  /** IDs de los ancestros hasta la raíz, en orden. */
  taxonomyPath: string[];
  /** IDs descendientes resueltos (incluye el propio nodo). */
  descendantIds: string[];
  /** Número solicitado de actividades. */
  requestedCount: number;
}

export interface PracticeRunProps {
  id: string;
  userId: string;
  mode: PracticeRunMode;
  scope: PracticeScope;
  activityIds: string[];
  /** Versiones de catálogo fijadas para cada posición del run. */
  activityVersionIds?: Array<string | null>;
  /** Copias inmutables de las actividades usadas por cada posición. */
  activitySnapshots?: Array<Activity | null>;
  /** Activities appended after a failure for one immediate recovery attempt. */
  repetitionActivityIds?: string[];
  /** Count of activities originally selected, excluding repetitions. */
  originalActivityCount?: number;
  currentIndex: number;
  status: PracticeRunStatus;
  datasetVersion: string;
  dailySessionId: string | null;
  createdAt: string;
}

/**
 * Aggregate root de cualquier lote de actividades (DAILY, SMART_REVIEW o
 * FOCUSED). Centraliza la corrección y el avance del run.
 */
export class PracticeRun extends AggregateRoot<string> {
  private props: PracticeRunProps;

  private constructor(props: PracticeRunProps) {
    super(props.id);
    const activityVersionIds = props.activityVersionIds ?? props.activityIds.map(() => null);
    const activitySnapshots = props.activitySnapshots ?? props.activityIds.map(() => null);
    if (activityVersionIds.length !== props.activityIds.length) {
      throw new InvariantViolationException(
        "Activity versions must match the run activities",
        "The practice run snapshot is invalid.",
      );
    }
    if (activitySnapshots.length !== props.activityIds.length) {
      throw new InvariantViolationException(
        "Activity snapshots must match the run activities",
        "The practice run snapshot is invalid.",
      );
    }
    this.props = {
      ...props,
      activityIds: [...props.activityIds],
      activityVersionIds: [...activityVersionIds],
      activitySnapshots: activitySnapshots.map(cloneActivity),
      repetitionActivityIds: [...(props.repetitionActivityIds ?? [])],
      originalActivityCount: props.originalActivityCount ?? props.activityIds.length,
    };
  }

  static create(props: PracticeRunProps): PracticeRun {
    if (props.activityIds.length === 0) {
      throw new InvariantViolationException(
        "A practice run needs at least one activity",
        "A practice run needs at least one activity.",
      );
    }
    if (props.currentIndex < 0 || props.currentIndex > props.activityIds.length) {
      throw new InvariantViolationException(
        "currentIndex out of bounds",
        "The run position is invalid.",
      );
    }
    return new PracticeRun(props);
  }

  get userId(): string {
    return this.props.userId;
  }

  get mode(): PracticeRunMode {
    return this.props.mode;
  }

  get scope(): PracticeScope {
    return this.props.scope;
  }

  get activityIds(): string[] {
    return [...this.props.activityIds];
  }

  get activityVersionIds(): Array<string | null> {
    return [...(this.props.activityVersionIds ?? [])];
  }

  get activitySnapshots(): Array<Activity | null> {
    return (this.props.activitySnapshots ?? this.props.activityIds.map(() => null)).map(cloneActivity);
  }

  get currentIndex(): number {
    return this.props.currentIndex;
  }

  get status(): PracticeRunStatus {
    return this.props.status;
  }

  get datasetVersion(): string {
    return this.props.datasetVersion;
  }

  get dailySessionId(): string | null {
    return this.props.dailySessionId;
  }

  get currentActivityId(): string | null {
    if (this.props.status === "completed") return null;
    return this.props.activityIds[this.props.currentIndex] ?? null;
  }

  get currentActivityVersionId(): string | null {
    if (this.props.status === "completed") return null;
    return this.props.activityVersionIds?.[this.props.currentIndex] ?? null;
  }

  get currentActivitySnapshot(): Activity | null {
    if (this.props.status === "completed") return null;
    return cloneActivity(this.props.activitySnapshots?.[this.props.currentIndex] ?? null);
  }

  get originalActivityCount(): number {
    return this.props.originalActivityCount ?? this.props.activityIds.length;
  }

  get isCurrentActivityRepetition(): boolean {
    return this.props.currentIndex >= this.originalActivityCount;
  }

  /**
   * Adds at most one immediate repetition for an activity. The set is keyed
   * by activity id so a failed repetition cannot recursively append another.
   */
  scheduleRepetition(
    activityId: string,
    activityVersionId: string | null = null,
    activitySnapshot: Activity | null = null,
  ): boolean {
    if (this.props.repetitionActivityIds?.includes(activityId)) return false;
    this.props.activityIds.push(activityId);
    this.props.activityVersionIds?.push(activityVersionId);
    this.props.activitySnapshots?.push(cloneActivity(activitySnapshot));
    this.props.repetitionActivityIds = [
      ...(this.props.repetitionActivityIds ?? []),
      activityId,
    ];
    return true;
  }

  /** Avanza al siguiente intento. Devuelve true si el run se completó. */
  advance(): boolean {
    if (this.props.status === "completed") {
      throw new InvariantViolationException(
        "Cannot advance a completed run",
        "This practice run is already completed.",
      );
    }
    this.props.currentIndex += 1;
    if (this.props.currentIndex >= this.props.activityIds.length) {
      this.props.status = "completed";
      return true;
    }
    return false;
  }

  toSnapshot(): PracticeRunProps {
    return {
      ...this.props,
      activityIds: [...this.props.activityIds],
      activityVersionIds: [...(this.props.activityVersionIds ?? [])],
      activitySnapshots: (this.props.activitySnapshots ?? this.props.activityIds.map(() => null)).map(cloneActivity),
      repetitionActivityIds: [...(this.props.repetitionActivityIds ?? [])],
      scope: { ...this.props.scope, descendantIds: [...this.props.scope.descendantIds] },
    };
  }
}

function cloneActivity(activity: Activity | null): Activity | null {
  return activity ? (JSON.parse(JSON.stringify(activity)) as Activity) : null;
}
