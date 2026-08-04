import { expect, test } from "@playwright/test";

test.describe("demo account", () => {
  test("creates a real session, keeps normal navigation and exposes only the demo catalog", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Probar la demo|Try the demo/i }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("¡Hola, Alex!")).toBeVisible();
    await expect(page.getByText("75%", { exact: true })).toBeVisible();
    await expect(page.getByText("6 available")).toBeVisible();
    await expect(page.getByText("12 formats")).toBeVisible();
    await expect(page.getByText("demo@englishloop.local")).toBeVisible();

    const result = await page.evaluate(async () => {
      const response = await fetch("/api/auth/get-session");
      const [session, lessons, activities] = await Promise.all([
        response.json(),
        fetch("/api/v1/lessons?limit=100").then((item) => item.json()),
        fetch("/api/v1/activities?limit=100").then((item) => item.json()),
      ]);
      return { session, lessons, activities };
    });
    expect(result.session).toMatchObject({
      user: { email: "demo@englishloop.local", isDemo: true },
    });
    expect(result.lessons.items).toHaveLength(6);
    expect(result.activities.items).toHaveLength(12);

    for (const path of ["/lessons", "/activities", "/review", "/progress", "/settings"]) {
      await page.goto("/");
      await page.locator(`aside a[href="${path}"]`).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("main")).toBeVisible();
    }
  });
});
