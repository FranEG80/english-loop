// @vitest-environment node
import { describe, expect, it } from "vitest";
import path from "node:path";
import { FileActivityCatalogAdapter } from "./file-activity-catalog-adapter";

describe("FileActivityCatalogAdapter", () => {
  it("filters published activities and counts taxonomy descendants", async () => {
    const adapter = new FileActivityCatalogAdapter(path.join(process.cwd(), "DATASET"));
    const b1 = await adapter.listActivities({ level: "B1" });
    const both = await adapter.listActivities({ level: "both" });
    expect(b1.length).toBeGreaterThan(0);
    expect(both.length).toBeGreaterThanOrEqual(b1.length);
    expect(await adapter.countActivitiesByNodes(["ability-permission"], "B1")).toBeGreaterThan(0);
    expect(await adapter.getActivityById("missing")).toBeNull();
  });
});
