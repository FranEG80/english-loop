import { expect, test, type Page } from "@playwright/test";

async function enterDemo(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Probar la demo|Try the demo/i })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("narrows a focused practice scope one taxonomy level at a time", async ({
  page,
}) => {
  await enterDemo(page);
  await page.goto("/review/focus");

  const grammar = page.getByRole("button", { name: /Gramática|Grammar/ });
  await expect(grammar).toHaveAttribute("aria-pressed", "true");

  const topic = page.getByRole("combobox", { name: /Tema|Topic/ });
  await topic.selectOption({ label: "Tiempos verbales" });

  const subtopic = page.getByRole("combobox", { name: /Subtema|Subtopic/ });
  await subtopic.selectOption({ label: "Formas de futuro" });

  const skill = page.getByRole("combobox", { name: /Habilidad|Skill/ });
  await skill.selectOption({ label: "Will para predicciones" });

  const selection = page.getByRole("complementary", {
    name: /Tu enfoque|Your focus/,
  });
  await expect(selection).toContainText("Will para predicciones");
  await expect(page.getByRole("radio", { name: "B1" })).toBeEnabled();
  await expect(page.getByRole("radio", { name: "B2" })).toBeDisabled();
});
