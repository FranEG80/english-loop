/*
  Warnings:

  - You are about to drop the column `dailySessionId` on the `PracticeRun` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "datasetVersion" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "practiceRunId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailySession_practiceRunId_fkey" FOREIGN KEY ("practiceRunId") REFERENCES "PracticeRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DailySession" ("createdAt", "datasetVersion", "date", "id", "seed", "status", "updatedAt", "userId") SELECT "createdAt", "datasetVersion", "date", "id", "seed", "status", "updatedAt", "userId" FROM "DailySession";
DROP TABLE "DailySession";
ALTER TABLE "new_DailySession" RENAME TO "DailySession";
CREATE UNIQUE INDEX "DailySession_practiceRunId_key" ON "DailySession"("practiceRunId");
CREATE INDEX "DailySession_userId_date_idx" ON "DailySession"("userId", "date");
CREATE UNIQUE INDEX "DailySession_userId_date_key" ON "DailySession"("userId", "date");
CREATE TABLE "new_PracticeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "scopeSnapshot" TEXT NOT NULL,
    "activityIds" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "datasetVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PracticeRun" ("activityIds", "createdAt", "currentIndex", "datasetVersion", "id", "mode", "scopeSnapshot", "status", "updatedAt", "userId") SELECT "activityIds", "createdAt", "currentIndex", "datasetVersion", "id", "mode", "scopeSnapshot", "status", "updatedAt", "userId" FROM "PracticeRun";
DROP TABLE "PracticeRun";
ALTER TABLE "new_PracticeRun" RENAME TO "PracticeRun";
CREATE INDEX "PracticeRun_userId_mode_idx" ON "PracticeRun"("userId", "mode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
