import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { Client as PgClient } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaReviewRepository } from "@/server/infrastructure/persistence/prisma-review-repository";
import { PrismaUserSettingsRepository } from "@/server/infrastructure/persistence/prisma-user-settings-repository";
import { ReviewItem } from "@/core/progress/domain/review-item";
import { UserSettings } from "@/core/account/domain/user-settings";
import { renderProviderSchema } from "./schema-parity";
import type { PrismaClient } from "@/generated/prisma/client";

async function run(command: string, args: string[], cwd: string): Promise<string> {
  const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
  child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${stderr}`);
  return stdout;
}

async function createPostgresClient(databaseUrl: string, root: string, tempRoot: string) {
  const source = await readFile(path.join(root, "prisma/schema.prisma"), "utf8");
  const output = path.join(tempRoot, "client");
  const schema = renderProviderSchema(source, "postgresql").replace(
    /output\s*=\s*"[^"]+"/,
    `output = ${JSON.stringify(output)}`,
  );
  const schemaPath = path.join(tempRoot, "schema.postgresql.prisma");
  await writeFile(schemaPath, schema, "utf8");
  await run("pnpm", ["prisma", "generate", "--schema", schemaPath], root);

  const baseline = await run(
    "pnpm",
    ["prisma", "migrate", "diff", "--from-empty", "--to-schema", schemaPath, "--script"],
    root,
  );
  const database = new PgClient({ connectionString: databaseUrl });
  await database.connect();
  await database.query(baseline);
  await database.end();

  const generated = await import(pathToFileURL(path.join(output, "client.ts")).href);
  const client = new generated.PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  return client as PrismaClient;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.TEST_POSTGRES_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "TEST_POSTGRES_DATABASE_URL is required. Start an isolated PostgreSQL instance and run pnpm test:postgres.",
    );
  }

  const root = process.cwd();
  const tempRoot = await mkdtemp(path.join(tmpdir(), "english-loop-postgres-"));
  let prisma: PrismaClient | null = null;
  try {
    prisma = await createPostgresClient(databaseUrl, root, tempRoot);
    const settings = new PrismaUserSettingsRepository(prisma);
    const reviews = new PrismaReviewRepository(prisma);

    const userSettings = UserSettings.create({
      userId: "postgres-contract-user",
      locale: "en",
      activeLevels: ["B1", "B2"],
      dailyGoalLessons: 2,
      dailyGoalActivities: 10,
      timezone: "Europe/Madrid",
      reducedMotion: false,
    });
    await settings.save(userSettings);
    assert.deepEqual((await settings.findByUserId(userSettings.userId))?.activeLevels, ["B1", "B2"]);

    const review = ReviewItem.create({
      id: "postgres-contract-review",
      userId: userSettings.userId,
      activityId: "activity-1",
      taxonomyNodeId: "grammar",
      level: "B1",
      stage: 0,
      consecutiveCorrect: 0,
      dueAt: "2026-08-04T00:00:00.000Z",
      failedAt: "2026-08-03T00:00:00.000Z",
      resolvedAt: null,
      attemptsCount: 1,
    });
    await reviews.save(review);
    assert.equal((await reviews.findByUserIdAndActivity(userSettings.userId, "activity-1"))?.id, review.id);
    assert.equal((await reviews.findDueByUserId(userSettings.userId, "2026-08-05T00:00:00.000Z")).length, 1);

    console.log("PostgreSQL repository contracts passed: UserSettingsRepository, ReviewRepository");
  } finally {
    await prisma?.$disconnect();
    await rm(tempRoot, { recursive: true, force: true });
  }
}

await main();
