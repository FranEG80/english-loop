import { expect, test } from "@playwright/test";

test("shows numbered lesson pagination above the catalogue and preserves the page in the URL", async ({
  page,
}) => {
  const email = `catalog-pagination-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel(/Nombre|Name/).fill("Catalog pagination E2E");
  await page.getByLabel(/Email/).fill(email);
  await page
    .getByLabel(/Contraseña|Password/)
    .fill("Catalog-pagination-123!");
  await page
    .getByRole("button", { name: /Crear cuenta|Create account/ })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/lessons");
  const topPagination = page.getByRole("navigation", {
    name: /Paginación superior de resultados|Top results pagination/,
  });
  await expect(topPagination).toBeVisible();
  await expect(topPagination).toContainText(/Página 1 de|Page 1 of/);

  await topPagination
    .getByRole("link", { name: /Siguiente|Next/ })
    .click();

  await expect(page).toHaveURL(/\/lessons\?page=2$/);
  await expect(
    page.getByRole("navigation", {
      name: /Paginación superior de resultados|Top results pagination/,
    }),
  ).toContainText(/Página 2 de|Page 2 of/);
});
