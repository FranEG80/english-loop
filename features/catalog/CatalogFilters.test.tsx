import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { CatalogFilters } from "./CatalogFilters";

const categoryField = {
  name: "category",
  label: en.catalog.categoryLabel,
  allLabel: en.catalog.allCategories,
  options: [
    { value: "grammar", label: "Grammar" },
    { value: "vocabulary", label: "Vocabulary" },
  ],
};

describe("CatalogFilters", () => {
  it("keeps filters compact until the user opens them", async () => {
    const user = userEvent.setup();
    render(
      <CatalogFilters
        dictionary={en}
        clearHref="/lessons"
        fields={[categoryField]}
        resultCount={24}
      />,
    );

    const details = screen.getByText(en.catalog.filtersTitle).closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByRole("status")).toHaveTextContent("24 results");

    await user.click(screen.getByText(en.catalog.filtersTitle));

    expect(details).toHaveAttribute("open");
    expect(screen.getByRole("textbox", { name: en.catalog.searchLabel })).toBeVisible();
    expect(screen.getByRole("combobox", { name: en.catalog.categoryLabel })).toHaveValue("");
  });

  it("opens active filters, restores every value and exposes a clear link", () => {
    render(
      <CatalogFilters
        dictionary={en}
        clearHref="/lessons"
        fields={[{ ...categoryField, value: "grammar" }]}
        query="conditionals"
        level="B2"
        resultCount={3}
      />,
    );

    const details = screen.getByText(en.catalog.filtersTitle).closest("details");
    expect(details).toHaveAttribute("open");
    expect(screen.getByText(`3 ${en.catalog.activeFilters}`)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: en.catalog.searchLabel })).toHaveValue("conditionals");
    expect(screen.getByRole("combobox", { name: en.catalog.levelLabel })).toHaveValue("B2");
    expect(screen.getByRole("combobox", { name: en.catalog.categoryLabel })).toHaveValue("grammar");
    expect(screen.getByRole("link", { name: en.catalog.clearFilters })).toHaveAttribute("href", "/lessons");
  });
});
