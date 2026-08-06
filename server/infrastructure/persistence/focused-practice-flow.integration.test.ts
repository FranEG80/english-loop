// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaCatalogAdapter } from "@/adapters/content/prisma-catalog-adapter";
import { FileActivityCatalogAdapter } from "@/adapters/content/file-activity-catalog-adapter";
import { FileTaxonomyCatalogAdapter } from "@/adapters/content/file-taxonomy-catalog-adapter";
import { createFocusedPracticeRun } from "@/core/practice/application/use-cases/create-focused-practice-run";
import { PracticeRunPlanner } from "@/core/practice/domain/practice-run-planner";
import type { Actor, IdentityPort } from "@/core/account/ports/identity-port";
import { DEMO_USER_EMAIL, DEMO_USER_ID } from "@/core/content/domain/demo-fixture";
import { PrismaPracticeRunRepository } from "./prisma-practice-run-repository";
import { readFile } from "node:fs/promises";
import path from "node:path";

const enabled = process.env.RUN_DB_INTEGRATION === "1";
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase("focused practice with the seeded Prisma catalogue", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    const databaseUrl = process.env.TEST_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "TEST_DATABASE_URL must point to an isolated migrated and seeded database",
      );
    }
    prisma = new PrismaClient({
      adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
    });
  });

  afterAll(async () => prisma.$disconnect());

  it("creates and persists the same demo run submitted by the focus form", async () => {
    const actor: Actor = {
      userId: DEMO_USER_ID,
      name: "Alex",
      email: DEMO_USER_EMAIL,
      isDemo: true,
      activeLevels: ["B1", "B2"],
    };
    const identity: IdentityPort = {
      getActor: async () => actor,
      requireActor: async () => actor,
    };
    const catalog = new PrismaCatalogAdapter(prisma, { includeDemo: true });
    const repository = new PrismaPracticeRunRepository(prisma);

    const { run } = await createFocusedPracticeRun(
      identity,
      repository,
      catalog,
      catalog,
      new PracticeRunPlanner({
        int: () => 0,
        float: () => 0,
        shuffle: (items) => [...items],
      }),
      { generate: () => "focused-practice-integration" },
      {
        now: () => new Date("2026-08-06T12:00:00.000Z"),
        nowIso: () => "2026-08-06T12:00:00.000Z",
      },
      (await catalog.getContentVersion()).datasetVersion,
      { taxonomyNodeId: "grammar", level: "both", sessionSize: 5 },
    );

    expect(run.activityIds).toHaveLength(5);
    await expect(repository.findById(run.id)).resolves.toMatchObject({
      id: run.id,
      userId: DEMO_USER_ID,
      activityIds: run.activityIds,
    });
  });

  it("creates and persists the normal-user run against the file catalogue", async () => {
    const datasetRoot = path.join(process.cwd(), "DATASET");
    const datasetVersion = (
      await readFile(path.join(datasetRoot, "VERSION"), "utf8")
    ).trim();
    const actor: Actor = {
      userId: "focused-practice-normal-user",
      name: "Normal user",
      email: "normal@example.com",
      isDemo: false,
      activeLevels: ["B1", "B2"],
    };
    const identity: IdentityPort = {
      getActor: async () => actor,
      requireActor: async () => actor,
    };

    const { run } = await createFocusedPracticeRun(
      identity,
      new PrismaPracticeRunRepository(prisma),
      new FileActivityCatalogAdapter(datasetRoot),
      new FileTaxonomyCatalogAdapter(datasetRoot, datasetVersion),
      new PracticeRunPlanner({
        int: () => 0,
        float: () => 0,
        shuffle: (items) => [...items],
      }),
      { generate: () => "focused-practice-file-integration" },
      {
        now: () => new Date("2026-08-06T12:00:00.000Z"),
        nowIso: () => "2026-08-06T12:00:00.000Z",
      },
      datasetVersion,
      { taxonomyNodeId: "grammar", level: "both", sessionSize: 5 },
    );

    expect(run.activityIds).toHaveLength(5);
  });
});
