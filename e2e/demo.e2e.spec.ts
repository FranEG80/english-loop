import { expect, test } from "@playwright/test";

test.describe("public demo", () => {
  test("shows the seeded demo account without creating an auth session", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByText("¡Hola, Alex!")).toBeVisible();
    await expect(page.getByText("75%", { exact: true })).toBeVisible();
    await expect(page.getByText("6 available")).toBeVisible();
    await expect(page.getByText("12 formats")).toBeVisible();
    await expect(page.getByText("demo@englishloop.local")).toBeVisible();

    const session = await page.evaluate(async () => {
      const response = await fetch("/api/auth/get-session");
      return response.json();
    });
    expect(session).toBeNull();
  });
});
