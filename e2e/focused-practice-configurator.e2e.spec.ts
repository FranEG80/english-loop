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

  await page.getByRole("button", { name: "Use of English" }).click();
  await page.getByRole("radio", { name: "B1" }).click();
  const useOfEnglishSkills = page.getByRole("combobox", {
    name: /Habilidad|Skill/,
  });
  const visibleSkillLabels = await useOfEnglishSkills
    .locator("option")
    .allTextContents();
  expect(visibleSkillLabels.some((label) => /\bB1\b/.test(label))).toBe(true);
  expect(visibleSkillLabels.some((label) => /\bB2\b/.test(label))).toBe(false);

  const grammar = page.getByRole("button", { name: /Gramática|Grammar/ });
  await grammar.click();
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
  await expect(page.getByRole("radio", { name: "B2" })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Empezar|Start/ })).toBeDisabled();
});

test("creates a real focused-practice run from the configurator", async ({
  page,
}) => {
  await enterDemo(page);
  await page.goto("/review/focus");

  await expect(page.getByRole("status")).toContainText(
    /actividades disponibles|activities available/i,
  );
  await page.getByRole("button", { name: /Empezar|Start/ }).click();

  await expect(page).toHaveURL(/\/review\/session\/[^/?]+\?activityId=/);
  await expect(page.getByRole("progressbar")).toBeVisible();
});
