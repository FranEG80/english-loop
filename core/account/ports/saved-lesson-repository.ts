import type { SavedLesson } from "../domain/saved-lesson";

export interface SavedLessonRepository {
  findByUserId(userId: string): Promise<SavedLesson[]>;
  findByUserAndLesson(
    userId: string,
    lessonId: string,
  ): Promise<SavedLesson | null>;
  save(lesson: SavedLesson): Promise<void>;
  delete(userId: string, lessonId: string): Promise<void>;
}
