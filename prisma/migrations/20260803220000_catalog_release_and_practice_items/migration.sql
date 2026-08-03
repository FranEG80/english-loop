-- AlterTable
ALTER TABLE "ReviewItem" ADD COLUMN "activityVersionId" TEXT;
ALTER TABLE "ReviewItem" ADD COLUMN "lessonId" TEXT;

-- CreateTable
CREATE TABLE "CatalogRelease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetVersion" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CatalogPublication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogPublication_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogRelease" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityType" (
    "code" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "EvaluatorStrategy" (
    "code" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "CefrLevel" (
    "code" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "EditorialStatus" (
    "code" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "TaxonomyNode" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "TaxonomyNodeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "parentId" TEXT,
    "kind" TEXT NOT NULL,
    "labelsEn" TEXT NOT NULL,
    "labelsEs" TEXT NOT NULL,
    "levels" TEXT NOT NULL,
    "selectableForPractice" BOOLEAN NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "TaxonomyNodeVersion_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogRelease" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaxonomyNodeVersion_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaxonomyNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "LessonVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "levelCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "examples" TEXT NOT NULL,
    "commonMistakes" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "contentVersion" INTEGER NOT NULL,
    "statusCode" TEXT NOT NULL,
    CONSTRAINT "LessonVersion_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogRelease" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonVersion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LessonVersion_levelCode_fkey" FOREIGN KEY ("levelCode") REFERENCES "CefrLevel" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LessonVersion_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "EditorialStatus" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LessonVersionTaxonomy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonVersionId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    CONSTRAINT "LessonVersionTaxonomy_lessonVersionId_fkey" FOREIGN KEY ("lessonVersionId") REFERENCES "LessonVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonVersionTaxonomy_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "ActivityVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "activityTypeCode" TEXT NOT NULL,
    "evaluatorStrategyCode" TEXT NOT NULL,
    "levelCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "passage" TEXT,
    "explanation" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "lessonIds" TEXT NOT NULL,
    "estimatedSeconds" INTEGER NOT NULL,
    "evaluatorData" TEXT NOT NULL,
    "statusCode" TEXT NOT NULL,
    CONSTRAINT "ActivityVersion_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogRelease" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersion_activityTypeCode_fkey" FOREIGN KEY ("activityTypeCode") REFERENCES "ActivityType" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersion_evaluatorStrategyCode_fkey" FOREIGN KEY ("evaluatorStrategyCode") REFERENCES "EvaluatorStrategy" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersion_levelCode_fkey" FOREIGN KEY ("levelCode") REFERENCES "CefrLevel" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersion_statusCode_fkey" FOREIGN KEY ("statusCode") REFERENCES "EditorialStatus" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityVersionLesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityVersionId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ActivityVersionLesson_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersionLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityVersionTaxonomy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityVersionId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ActivityVersionTaxonomy_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityVersionTaxonomy_taxonomyNodeId_fkey" FOREIGN KEY ("taxonomyNodeId") REFERENCES "TaxonomyNode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityVersionOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityVersionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ActivityVersionOption_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityVersionToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityVersionId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ActivityVersionToken_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityVersionPair" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityVersionId" TEXT NOT NULL,
    "leftId" TEXT NOT NULL,
    "leftLabel" TEXT NOT NULL,
    "rightId" TEXT NOT NULL,
    "rightLabel" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ActivityVersionPair_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityExpectedAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityVersionId" TEXT NOT NULL,
    "gapId" TEXT,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ActivityExpectedAnswer_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeRunItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceRunId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "lessonId" TEXT,
    "activityId" TEXT NOT NULL,
    "activityVersionId" TEXT,
    "origin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isRepetition" BOOLEAN NOT NULL DEFAULT false,
    "repetitionOfItemId" TEXT,
    "answeredAt" DATETIME,
    CONSTRAINT "PracticeRunItem_practiceRunId_fkey" FOREIGN KEY ("practiceRunId") REFERENCES "PracticeRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeRunItem_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PracticeRunItem_repetitionOfItemId_fkey" FOREIGN KEY ("repetitionOfItemId") REFERENCES "PracticeRunItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Preserve the legacy JSON run order while moving it to normalized items.
-- Foreign keys are deferred below during the table rebuild; published
-- catalog versions can be attached by the first database seed.
INSERT INTO "PracticeRunItem" ("id", "practiceRunId", "position", "activityId", "origin", "status", "isRepetition")
SELECT lower(hex(randomblob(16))), "PracticeRun"."id", json_each.key,
       json_each.value, "PracticeRun"."mode", 'pending', false
FROM "PracticeRun", json_each("PracticeRun"."activityIds");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActivityAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "practiceRunId" TEXT,
    "activityId" TEXT NOT NULL,
    "activityVersionId" TEXT,
    "practiceRunItemId" TEXT,
    "origin" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "isRepetition" BOOLEAN NOT NULL DEFAULT false,
    "evaluatorVersion" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityAttempt_practiceRunId_fkey" FOREIGN KEY ("practiceRunId") REFERENCES "PracticeRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityAttempt_activityVersionId_fkey" FOREIGN KEY ("activityVersionId") REFERENCES "ActivityVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityAttempt_practiceRunItemId_fkey" FOREIGN KEY ("practiceRunItemId") REFERENCES "PracticeRunItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActivityAttempt" ("activityId", "evaluatorVersion", "id", "idempotencyKey", "isCorrect", "isRepetition", "origin", "practiceRunId", "response", "submittedAt", "userId") SELECT "activityId", "evaluatorVersion", "id", "idempotencyKey", "isCorrect", false, "origin", "practiceRunId", "response", "submittedAt", "userId" FROM "ActivityAttempt";
DROP TABLE "ActivityAttempt";
ALTER TABLE "new_ActivityAttempt" RENAME TO "ActivityAttempt";
CREATE INDEX "ActivityAttempt_userId_activityId_idx" ON "ActivityAttempt"("userId", "activityId");
CREATE INDEX "ActivityAttempt_userId_submittedAt_idx" ON "ActivityAttempt"("userId", "submittedAt");
CREATE INDEX "ActivityAttempt_activityVersionId_idx" ON "ActivityAttempt"("activityVersionId");
CREATE INDEX "ActivityAttempt_practiceRunItemId_idx" ON "ActivityAttempt"("practiceRunItemId");
CREATE UNIQUE INDEX "ActivityAttempt_userId_idempotencyKey_key" ON "ActivityAttempt"("userId", "idempotencyKey");
CREATE TABLE "new_DatasetImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetVersion" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "result" TEXT,
    "error" TEXT,
    "releaseId" TEXT,
    CONSTRAINT "DatasetImport_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "CatalogRelease" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DatasetImport" ("checksum", "datasetVersion", "error", "finishedAt", "id", "result", "startedAt", "status") SELECT "checksum", "datasetVersion", "error", "finishedAt", "id", "result", "startedAt", "status" FROM "DatasetImport";
DROP TABLE "DatasetImport";
ALTER TABLE "new_DatasetImport" RENAME TO "DatasetImport";
CREATE INDEX "DatasetImport_datasetVersion_idx" ON "DatasetImport"("datasetVersion");
CREATE TABLE "new_PracticeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "scopeSnapshot" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "originalActivityCount" INTEGER NOT NULL DEFAULT 0,
    "datasetVersion" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PracticeRun" ("createdAt", "currentIndex", "datasetVersion", "id", "mode", "scopeSnapshot", "status", "originalActivityCount", "updatedAt", "userId") SELECT "createdAt", "currentIndex", "datasetVersion", "id", "mode", "scopeSnapshot", "status", COALESCE(json_array_length("activityIds"), 0), "updatedAt", "userId" FROM "PracticeRun";
DROP TABLE "PracticeRun";
ALTER TABLE "new_PracticeRun" RENAME TO "PracticeRun";
CREATE INDEX "PracticeRun_userId_mode_idx" ON "PracticeRun"("userId", "mode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CatalogRelease_status_publishedAt_idx" ON "CatalogRelease"("status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogRelease_datasetVersion_checksum_key" ON "CatalogRelease"("datasetVersion", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogPublication_releaseId_key" ON "CatalogPublication"("releaseId");

-- CreateIndex
CREATE INDEX "TaxonomyNodeVersion_releaseId_parentId_sortOrder_idx" ON "TaxonomyNodeVersion"("releaseId", "parentId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyNodeVersion_releaseId_nodeId_key" ON "TaxonomyNodeVersion"("releaseId", "nodeId");

-- CreateIndex
CREATE INDEX "LessonVersion_releaseId_statusCode_levelCode_idx" ON "LessonVersion"("releaseId", "statusCode", "levelCode");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVersion_releaseId_lessonId_key" ON "LessonVersion"("releaseId", "lessonId");

-- CreateIndex
CREATE INDEX "LessonVersionTaxonomy_taxonomyNodeId_idx" ON "LessonVersionTaxonomy"("taxonomyNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonVersionTaxonomy_lessonVersionId_taxonomyNodeId_key" ON "LessonVersionTaxonomy"("lessonVersionId", "taxonomyNodeId");

-- CreateIndex
CREATE INDEX "ActivityVersion_releaseId_statusCode_levelCode_idx" ON "ActivityVersion"("releaseId", "statusCode", "levelCode");

-- CreateIndex
CREATE INDEX "ActivityVersion_activityId_idx" ON "ActivityVersion"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVersion_releaseId_activityId_key" ON "ActivityVersion"("releaseId", "activityId");

-- CreateIndex
CREATE INDEX "ActivityVersionLesson_lessonId_idx" ON "ActivityVersionLesson"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVersionLesson_activityVersionId_lessonId_key" ON "ActivityVersionLesson"("activityVersionId", "lessonId");

-- CreateIndex
CREATE INDEX "ActivityVersionTaxonomy_taxonomyNodeId_idx" ON "ActivityVersionTaxonomy"("taxonomyNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVersionTaxonomy_activityVersionId_taxonomyNodeId_key" ON "ActivityVersionTaxonomy"("activityVersionId", "taxonomyNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVersionOption_activityVersionId_optionId_key" ON "ActivityVersionOption"("activityVersionId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityVersionToken_activityVersionId_tokenId_key" ON "ActivityVersionToken"("activityVersionId", "tokenId");

-- CreateIndex
CREATE INDEX "ActivityVersionPair_activityVersionId_position_idx" ON "ActivityVersionPair"("activityVersionId", "position");

-- CreateIndex
CREATE INDEX "ActivityExpectedAnswer_activityVersionId_gapId_position_idx" ON "ActivityExpectedAnswer"("activityVersionId", "gapId", "position");

-- CreateIndex
CREATE INDEX "PracticeRunItem_practiceRunId_status_idx" ON "PracticeRunItem"("practiceRunId", "status");

-- CreateIndex
CREATE INDEX "PracticeRunItem_activityId_idx" ON "PracticeRunItem"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeRunItem_practiceRunId_position_key" ON "PracticeRunItem"("practiceRunId", "position");
