import { AggregateRoot } from "@/core/shared/kernel";
import { InvalidSessionTransitionException } from "@/core/shared/exceptions";
import {
  DailySessionCompleted,
  DailySessionStarted,
  LessonCompleted,
  LessonSkipped,
  DailyPracticeStarted,
} from "./events";

export type DailySessionStatus = "not_started" | "lesson" | "practice" | "completed";

export type LessonAssignmentStatus = "pending" | "completed" | "skipped";

export interface LessonAssignment {
  lessonId: string;
  order: number;
  status: LessonAssignmentStatus;
  selectionReason: string;
  completedAt: string | null;
}

export interface DailySessionProps {
  id: string;
  userId: string;
  /** Fecha local del usuario (YYYY-MM-DD). */
  date: string;
  status: DailySessionStatus;
  datasetVersion: string;
  seed: string;
  lessons: LessonAssignment[];
  practiceRunId: string | null;
  createdAt: string;
}

/**
 * Aggregate root de la sesión diaria. Es un snapshot persistido y estable:
 * no cambia aunque cambie el dataset.
 */
export class DailySession extends AggregateRoot<string> {
  private props: DailySessionProps;

  private constructor(props: DailySessionProps) {
    super(props.id);
    this.props = props;
  }

  static create(props: DailySessionProps): DailySession {
    return new DailySession(props);
  }

  get userId(): string {
    return this.props.userId;
  }

  get date(): string {
    return this.props.date;
  }

  get status(): DailySessionStatus {
    return this.props.status;
  }

  get datasetVersion(): string {
    return this.props.datasetVersion;
  }

  get seed(): string {
    return this.props.seed;
  }

  get lessons(): LessonAssignment[] {
    return this.props.lessons.map((lesson) => ({ ...lesson }));
  }

  get practiceRunId(): string | null {
    return this.props.practiceRunId;
  }

  get currentLesson(): LessonAssignment | null {
    return (
      this.props.lessons.find((lesson) => lesson.status === "pending") ?? null
    );
  }

  /** Transición a la fase de lección. */
  startLessonPhase(nowIso: string): void {
    if (this.props.status !== "not_started") {
      throw new InvalidSessionTransitionException(
        `Cannot start lesson phase from ${this.props.status}`,
        "The daily session is not in a valid state.",
      );
    }
    this.props.status = "lesson";
    this.recordEvent(
      new DailySessionStarted(this.id, nowIso, this.userId, this.date),
    );
  }

  /** Marca una lección como completada. */
  completeLesson(lessonId: string, nowIso: string): void {
    const lesson = this.props.lessons.find((l) => l.lessonId === lessonId);
    if (!lesson) {
      throw new InvalidSessionTransitionException(
        `Lesson ${lessonId} is not assigned to this session`,
        "This lesson is not part of the daily session.",
      );
    }
    if (lesson.status === "completed") return;
    lesson.status = "completed";
    lesson.completedAt = nowIso;
    this.recordEvent(
      new LessonCompleted(this.id, nowIso, this.userId, lessonId),
    );
  }

  /** Marca una lección como omitida. */
  skipLesson(lessonId: string, nowIso: string): void {
    const lesson = this.props.lessons.find((l) => l.lessonId === lessonId);
    if (!lesson) {
      throw new InvalidSessionTransitionException(
        `Lesson ${lessonId} is not assigned to this session`,
        "This lesson is not part of the daily session.",
      );
    }
    if (lesson.status === "completed") return;
    lesson.status = "skipped";
    this.recordEvent(new LessonSkipped(this.id, nowIso, this.userId, lessonId));
  }

  /** Transición a la fase de práctica. */
  startPracticePhase(): void {
    if (this.props.status !== "lesson") {
      throw new InvalidSessionTransitionException(
        `Cannot start practice phase from ${this.props.status}`,
        "The daily session is not in a valid state.",
      );
    }
    if (this.props.lessons.some((lesson) => lesson.status === "pending")) {
      throw new InvalidSessionTransitionException(
        "Cannot start practice while lessons are pending",
        "Complete or skip all assigned lessons before practice.",
      );
    }
    this.props.status = "practice";
  }

  /** Completa la sesión diaria. */
  complete(nowIso: string): void {
    if (this.props.status === "completed") return;
    if (this.props.status !== "practice") {
      throw new InvalidSessionTransitionException(
        `Cannot complete session from ${this.props.status}`,
        "The daily session is not in a valid state.",
      );
    }
    this.props.status = "completed";
    this.recordEvent(
      new DailySessionCompleted(this.id, nowIso, this.userId, this.date),
    );
  }

  attachPracticeRun(practiceRunId: string): void {
    if (this.props.practiceRunId && this.props.practiceRunId !== practiceRunId) {
      throw new InvalidSessionTransitionException(
        "A different practice run is already attached",
        "The daily practice has already started.",
      );
    }
    this.props.practiceRunId = practiceRunId;
  }

  recordPracticeStarted(nowIso: string, practiceRunId: string): void {
    this.recordEvent(
      new DailyPracticeStarted(this.id, nowIso, this.userId, practiceRunId),
    );
  }

  toSnapshot(): DailySessionProps {
    return {
      ...this.props,
      lessons: this.props.lessons.map((lesson) => ({ ...lesson })),
    };
  }
}
