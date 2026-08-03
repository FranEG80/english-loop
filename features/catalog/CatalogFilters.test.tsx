import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { CatalogFilters } from "./CatalogFilters";

describe("CatalogFilters", () => {
  it("renders current filters and a clear link", () => {
    render(<CatalogFilters dictionary={en} clearHref="/lessons" query="conditionals" level="B2" />);
    expect(screen.getByRole("textbox")).toHaveValue("conditionals");
    expect(screen.getByRole("combobox")).toHaveValue("B2");
    expect(screen.getByRole("link", { name: en.catalog.clearFilters })).toHaveAttribute("href", "/lessons");
  });
});
