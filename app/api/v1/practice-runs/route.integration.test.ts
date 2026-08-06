// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@/core/account/ports/identity-port";
import {
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
} from "@/core/content/domain/demo-fixture";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { POST } from "./route";

const enabled = process.env.RUN_DB_INTEGRATION === "1";
const describeDatabase = enabled ? describe : describe.skip;

describeDatabase("POST /api/v1/practice-runs with real composition", () => {
  afterEach(() => vi.restoreAllMocks());

  it("creates the demo run through the real Route Handler", async () => {
    const actor: Actor = {
      userId: DEMO_USER_ID,
      name: "Alex",
      email: DEMO_USER_EMAIL,
      isDemo: true,
      activeLevels: ["B1", "B2"],
    };
    vi.spyOn(compositionRoot.identity, "requireActor").mockResolvedValue(actor);

    const response = await POST(
      new Request("http://test.local/api/v1/practice-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taxonomyNodeId: "grammar",
          level: "both",
          sessionSize: 5,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      status: "in_progress",
      activityIds: expect.arrayContaining([expect.any(String)]),
    });
  });
});
