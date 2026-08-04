-- Persist editorial lesson prerequisites without rewriting historical versions.
ALTER TABLE "LessonVersion" ADD COLUMN "prerequisites" TEXT NOT NULL DEFAULT '[]';
