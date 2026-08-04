import { z } from "zod";
import type { CatalogSeedInput, CatalogSeedResult, CatalogWritePort } from "@/core/content/ports/catalog-write-port";
import { D1_HTTP_MAX_BODY_BYTES } from "../d1-http";
import { D1_CATALOG_HTTP_BODY_MARGIN_BYTES } from "./constants";
import type { D1CatalogSeedSession } from "./types";

const responseSchema = z.object({
  releaseId: z.string(), importId: z.string(), status: z.enum(["started", "unchanged"]),
  result: z.object({ releaseId: z.string().nullable(), datasetVersion: z.string(), checksum: z.string(), status: z.enum(["dry_run", "published", "unchanged"]), counts: z.object({ taxonomy: z.number(), lessons: z.number(), activities: z.number() }) }).optional(),
});

/** Catalog writer for Node/Vercel; every chunk is authenticated independently. */
export class D1HttpCatalogWriteAdapter implements CatalogWritePort {
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly nonce: () => string;

  constructor(private readonly options: { url: string; token: string; fetch?: typeof fetch; now?: () => number; nonce?: () => string; maxBodyBytes?: number }) {
    this.fetcher = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.nonce = options.nonce ?? (() => crypto.randomUUID());
  }

  async seedCatalog(input: CatalogSeedInput, options: { dryRun?: boolean } = {}): Promise<CatalogSeedResult> {
    const counts = { taxonomy: input.taxonomy.length, lessons: input.lessons.length, activities: input.activities.length };
    if (options.dryRun) return { releaseId: null, datasetVersion: input.datasetVersion, checksum: input.checksum, status: "dry_run", counts };
    const session = responseSchema.parse(await this.post({ kind: "start", datasetVersion: input.datasetVersion, checksum: input.checksum, counts }));
    if (session.status === "unchanged") return session.result as CatalogSeedResult;
    try {
      await this.post({ kind: "references", releaseId: session.releaseId, chunk: {
        activityTypes: [...new Set(input.activities.map((activity) => activity.type))],
        evaluatorStrategies: [...new Set(input.activities.map((activity) => activity.evaluatorStrategy))],
        levels: [...new Set([...input.lessons.map((lesson) => lesson.level), ...input.activities.map((activity) => activity.level)])],
        statuses: [...new Set([...input.lessons.map((lesson) => lesson.status), ...input.activities.map((activity) => activity.status)])],
      } });
      await this.sendChunks("taxonomy", session, input.taxonomy);
      await this.sendChunks("lessons", session, input.lessons);
      await this.sendChunks("activities", session, input.activities);
      await this.post({ kind: "publish", releaseId: session.releaseId, importId: session.importId, result: JSON.stringify({ ...counts, checksum: input.checksum }) });
    } catch (error) {
      await this.post({ kind: "fail", releaseId: session.releaseId, importId: session.importId, error: error instanceof Error ? error.message : String(error) }).catch(() => undefined);
      throw error;
    }
    return { releaseId: session.releaseId, datasetVersion: input.datasetVersion, checksum: input.checksum, status: "published", counts };
  }

  async seedDemoAccount(): Promise<void> {
    await this.post({ kind: "demo-account" });
  }

  private async sendChunks(kind: "taxonomy" | "lessons" | "activities", session: D1CatalogSeedSession, values: unknown[]): Promise<void> {
    const maxBytes = this.options.maxBodyBytes ?? D1_HTTP_MAX_BODY_BYTES;
    let current: unknown[] = [];
    for (const value of values) {
      const candidate = [...current, value];
      const size = JSON.stringify({ kind, releaseId: session.releaseId, chunk: candidate }).length;
      if (current.length > 0 && size > maxBytes - D1_CATALOG_HTTP_BODY_MARGIN_BYTES) {
        await this.post({ kind, releaseId: session.releaseId, chunk: current });
        current = [value];
      } else current = candidate;
    }
    if (current.length > 0) await this.post({ kind, releaseId: session.releaseId, chunk: current });
  }

  private async post(body: Record<string, unknown>): Promise<unknown> {
    const timestamp = this.now();
    const seedUrl = new URL(this.options.url);
    seedUrl.pathname = `${seedUrl.pathname.replace(/\/$/, "")}/seed`;
    const response = await this.fetcher(seedUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.token}`,
        "content-type": "application/json",
        "x-d1-timestamp": String(timestamp),
        "x-d1-nonce": this.nonce(),
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(result.error ?? "D1 catalog seed request failed");
    return result;
  }
}
