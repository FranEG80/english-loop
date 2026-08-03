import { expect, test } from "@playwright/test";

test("health endpoint reports a live process", async ({ request }) => {
  const response = await request.get("/api/v1/health");

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
