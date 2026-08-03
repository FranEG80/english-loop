import { expect, test } from "@playwright/test";

test("public landing exposes the main entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tu inglés");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/register");
  await expect(header.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
});
