import type { CatalogWritePort, CatalogSeedInput, CatalogSeedResult } from "@/core/content/ports/catalog-write-port";
import type { D1DatabaseLike, D1Result } from "../types/binding";
import { CATALOG_IMPORT_FAILED, CATALOG_IMPORT_STARTED, CATALOG_RELEASE_PREPARING, D1_CATALOG_BATCH_SIZE } from "./constants";
import { activityStatements } from "./activity-statements";
import { lessonStatements } from "./lesson-statements";
import { taxonomyStatements } from "./taxonomy-statements";
import { publishStatements } from "./release-statements";
import { chunk, generatedId, statement } from "./shared";
import type { D1CatalogReleaseRow, D1CatalogSeedChunk, D1CatalogSeedSession, D1CatalogWriteOptions } from "./types";

export class D1CatalogWriteAdapter implements CatalogWritePort {
  constructor(private readonly database: D1DatabaseLike) {}

  async start(datasetVersion: string, checksum: string, counts: CatalogSeedResult["counts"]): Promise<D1CatalogSeedSession> {
    const existing = await this.database.prepare(`SELECT id, status FROM CatalogRelease WHERE datasetVersion = ? AND checksum = ?`).bind(datasetVersion, checksum).first<D1CatalogReleaseRow>();
    if (existing?.status === "published") {
      await this.run(statement(this.database, `INSERT INTO CatalogPublication (id, releaseId, publishedAt) VALUES ('active', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET releaseId = excluded.releaseId, publishedAt = CURRENT_TIMESTAMP`, [existing.id]));
      return { releaseId: existing.id, importId: "", status: "unchanged", result: { releaseId: existing.id, datasetVersion, checksum, status: "unchanged", counts } };
    }
    const releaseId = existing?.id ?? generatedId();
    const importId = generatedId();
    if (existing) await this.run(statement(this.database, "DELETE FROM CatalogRelease WHERE id = ?", [releaseId]));
    await this.run(statement(this.database, "INSERT INTO CatalogRelease (id, datasetVersion, checksum, status) VALUES (?, ?, ?, ?)", [releaseId, datasetVersion, checksum, CATALOG_RELEASE_PREPARING]));
    await this.run(statement(this.database, `INSERT INTO DatasetImport (id, datasetVersion, checksum, status, releaseId) VALUES (?, ?, ?, ?, ?)`, [importId, datasetVersion, checksum, CATALOG_IMPORT_STARTED, releaseId]));
    return { releaseId, importId, status: "started" };
  }

  async applyChunk(chunkToWrite: D1CatalogSeedChunk): Promise<void> {
    if (chunkToWrite.kind === "references") {
      const references = [
        ...chunkToWrite.activityTypes.map((code) => statement(this.database, "INSERT INTO ActivityType (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code])),
        ...chunkToWrite.evaluatorStrategies.map((code) => statement(this.database, "INSERT INTO EvaluatorStrategy (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code])),
        ...chunkToWrite.levels.map((code) => statement(this.database, "INSERT INTO CefrLevel (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code])),
        ...chunkToWrite.statuses.map((code) => statement(this.database, "INSERT INTO EditorialStatus (code) VALUES (?) ON CONFLICT(code) DO NOTHING", [code])),
      ];
      await this.runBatches(references);
      return;
    }
    if (chunkToWrite.kind === "taxonomy") await this.runBatches(taxonomyStatements(this.database, chunkToWrite.releaseId, chunkToWrite.nodes));
    if (chunkToWrite.kind === "lessons") await this.runBatches(lessonStatements(this.database, chunkToWrite.releaseId, chunkToWrite.lessons));
    if (chunkToWrite.kind === "activities") await this.runBatches(activityStatements(this.database, chunkToWrite.releaseId, chunkToWrite.activities));
  }

  async publish(session: D1CatalogSeedSession, result: string): Promise<void> {
    if (session.status === "unchanged") return;
    await this.runBatches(publishStatements(this.database, session.releaseId, session.importId, result));
  }

  async fail(session: D1CatalogSeedSession, error: unknown): Promise<void> {
    if (session.status === "unchanged") return;
    const message = error instanceof Error ? error.message : String(error);
    await this.run(statement(this.database, "UPDATE CatalogRelease SET status = ? WHERE id = ?", ["failed", session.releaseId])).catch(() => undefined);
    await this.run(statement(this.database, "UPDATE DatasetImport SET status = ?, finishedAt = CURRENT_TIMESTAMP, error = ? WHERE id = ?", [CATALOG_IMPORT_FAILED, message, session.importId])).catch(() => undefined);
  }

  async seedCatalog(input: CatalogSeedInput, options: D1CatalogWriteOptions = {}): Promise<CatalogSeedResult> {
    const counts = { taxonomy: input.taxonomy.length, lessons: input.lessons.length, activities: input.activities.length };
    if (options.dryRun) return { releaseId: null, datasetVersion: input.datasetVersion, checksum: input.checksum, status: "dry_run", counts };
    const session = await this.start(input.datasetVersion, input.checksum, counts);
    if (session.result) return session.result;
    try {
      await this.applyChunk({ kind: "references", releaseId: session.releaseId,
        activityTypes: [...new Set(input.activities.map((activity) => activity.type))],
        evaluatorStrategies: [...new Set(input.activities.map((activity) => activity.evaluatorStrategy))],
        levels: [...new Set([...input.lessons.map((lesson) => lesson.level), ...input.activities.map((activity) => activity.level)])],
        statuses: [...new Set([...input.lessons.map((lesson) => lesson.status), ...input.activities.map((activity) => activity.status)])] });
      await this.applyChunk({ kind: "taxonomy", releaseId: session.releaseId, nodes: input.taxonomy });
      await this.applyChunk({ kind: "lessons", releaseId: session.releaseId, lessons: input.lessons });
      await this.applyChunk({ kind: "activities", releaseId: session.releaseId, activities: input.activities });
      await this.publish(session, JSON.stringify({ ...counts, checksum: input.checksum }));
    } catch (error) {
      await this.fail(session, error);
      throw error;
    }
    return { releaseId: session.releaseId, datasetVersion: input.datasetVersion, checksum: input.checksum, status: "published", counts };
  }

  private async run(statementToRun: ReturnType<typeof statement>): Promise<D1Result> {
    const result = await statementToRun.run();
    if (!result.success) throw new Error("D1 catalog statement failed");
    return result;
  }

  private async runBatches(statements: ReturnType<typeof statement>[]): Promise<void> {
    for (const batch of chunk(statements, D1_CATALOG_BATCH_SIZE)) {
      if (batch.length === 0) continue;
      const results = await this.database.batch(batch);
      if (!results.every((result) => result.success)) throw new Error("D1 catalog batch failed");
    }
  }
}
