import { expect, test, type Page } from "@playwright/test";

async function enterDemo(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Probar la demo|Try the demo/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("catalog discovery", () => {
  test("filters lessons by category and finds a lesson by its canonical id", async ({
    page,
  }) => {
    await enterDemo(page);
    await page.goto("/lessons");

    await page.getByText(/Filtros|Filters/, { exact: true }).click();
    await page
      .getByRole("combobox", { name: /Categoría|Category/ })
      .selectOption("use-of-english");
    await page
      .getByRole("textbox", { name: /Buscar|Search/ })
      .fill("b2-use-of-english-key-word-transformations");
    await page
      .getByRole("button", { name: /Aplicar filtros|Apply filters/ })
      .click();

    await expect(page).toHaveURL(/category=use-of-english/);
    await expect(page).toHaveURL(/q=b2-use-of-english-key-word-transformations/);
    await expect(
      page.getByRole("heading", {
        name: "Key word transformations B2: conservar el significado",
      }),
    ).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText(/1/);
  });

  test("shows activity-specific category, type and interaction filters", async ({
    page,
  }) => {
    await enterDemo(page);
    await page.goto("/activities");

    await page.getByText(/Filtros|Filters/, { exact: true }).click();

    await expect(
      page.getByRole("combobox", { name: /Categoría|Category/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /Tipo|Type/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /Interacción|Interaction/ }),
    ).toBeVisible();
  });
});
