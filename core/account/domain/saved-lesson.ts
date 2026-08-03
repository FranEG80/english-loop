import { InvariantViolationException } from "@/core/shared/exceptions";

export interface SavedLessonProps {
  userId: string;
  lessonId: string;
  savedAt: string;
}

/** Lección guardada por un usuario. */
export class SavedLesson {
  private constructor(private readonly props: SavedLessonProps) {}

  static create(props: SavedLessonProps): SavedLesson {
    if (!props.lessonId) {
      throw new InvariantViolationException(
        "lessonId is required",
        "A lesson id is required.",
      );
    }
    return new SavedLesson({ ...props });
  }

  get userId(): string {
    return this.props.userId;
  }

  get lessonId(): string {
    return this.props.lessonId;
  }

  get savedAt(): string {
    return this.props.savedAt;
  }
}
