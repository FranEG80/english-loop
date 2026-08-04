import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("public landing has no critical or serious accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );

  expect(blocking).toEqual([]);
});
