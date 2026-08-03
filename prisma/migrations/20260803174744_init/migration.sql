-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" DATETIME,
    "refreshTokenExpiresAt" DATETIME,
    "scope" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'es',
    "activeLevels" TEXT NOT NULL DEFAULT 'B1',
    "dailyGoalLessons" INTEGER NOT NULL DEFAULT 1,
    "dailyGoalActivities" INTEGER NOT NULL DEFAULT 10,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedLesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "savedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedLesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "datasetVersion" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DailySessionLesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailySessionId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "selectionReason" TEXT NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "DailySessionLesson_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES "DailySession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "scopeSnapshot" TEXT NOT NULL,
    "activityIds" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "datasetVersion" TEXT NOT NULL,
    "dailySessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticeRun_dailySessionId_fkey" FOREIGN KEY ("dailySessionId") REFERENCES "DailySession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeRunActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceRunId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "answeredAt" DATETIME,
    CONSTRAINT "PracticeRunActivity_practiceRunId_fkey" FOREIGN KEY ("practiceRunId") REFERENCES "PracticeRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "practiceRunId" TEXT,
    "activityId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "evaluatorVersion" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityAttempt_practiceRunId_fkey" FOREIGN KEY ("practiceRunId") REFERENCES "PracticeRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserActivityProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lastResult" BOOLEAN,
    "lastAttemptAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserLessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" DATETIME,
    "errorsPending" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxonomyProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReviewItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "taxonomyNodeId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME NOT NULL,
    "failedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DatasetImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetVersion" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "result" TEXT,
    "error" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "SavedLesson_userId_idx" ON "SavedLesson"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedLesson_userId_lessonId_key" ON "SavedLesson"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "DailySession_userId_date_idx" ON "DailySession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySession_userId_date_key" ON "DailySession"("userId", "date");

-- CreateIndex
CREATE INDEX "DailySessionLesson_dailySessionId_idx" ON "DailySessionLesson"("dailySessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeRun_dailySessionId_key" ON "PracticeRun"("dailySessionId");

-- CreateIndex
CREATE INDEX "PracticeRun_userId_mode_idx" ON "PracticeRun"("userId", "mode");

-- CreateIndex
CREATE INDEX "PracticeRunActivity_practiceRunId_idx" ON "PracticeRunActivity"("practiceRunId");

-- CreateIndex
CREATE INDEX "ActivityAttempt_userId_activityId_idx" ON "ActivityAttempt"("userId", "activityId");

-- CreateIndex
CREATE INDEX "ActivityAttempt_userId_submittedAt_idx" ON "ActivityAttempt"("userId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityAttempt_userId_idempotencyKey_key" ON "ActivityAttempt"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "UserActivityProgress_userId_idx" ON "UserActivityProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivityProgress_userId_activityId_key" ON "UserActivityProgress"("userId", "activityId");

-- CreateIndex
CREATE INDEX "UserLessonProgress_userId_idx" ON "UserLessonProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLessonProgress_userId_lessonId_key" ON "UserLessonProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "TaxonomyProgress_userId_idx" ON "TaxonomyProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyProgress_userId_taxonomyNodeId_key" ON "TaxonomyProgress"("userId", "taxonomyNodeId");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_dueAt_idx" ON "ReviewItem"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_resolvedAt_idx" ON "ReviewItem"("userId", "resolvedAt");

-- CreateIndex
CREATE INDEX "DatasetImport_datasetVersion_idx" ON "DatasetImport"("datasetVersion");
