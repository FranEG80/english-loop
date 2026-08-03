export interface LessonProgressRecord {
  userId: string;
  lessonId: string;
  viewed: boolean;
  viewedAt: string | null;
  errorsPending: number;
}

export interface LessonProgressRepository {
  findByUserId(userId: string): Promise<LessonProgressRecord[]>;
  upsert(record: LessonProgressRecord): Promise<void>;
}
