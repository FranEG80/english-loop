import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { CatalogPagination } from "./CatalogPagination";

describe("CatalogPagination", () => {
  it("preserves filters while moving between numbered API pages", () => {
    render(
      <CatalogPagination
        basePath="/lessons"
        dictionary={en}
        page={2}
        placement="top"
        totalItems={40}
        totalPages={4}
        params={{ q: "key word", level: "B2" }}
      />,
    );
    expect(screen.getByRole("link", { name: en.common.previous })).toHaveAttribute(
      "href",
      "/lessons?q=key+word&level=B2",
    );
    expect(screen.getByRole("link", { name: en.common.next })).toHaveAttribute(
      "href",
      "/lessons?q=key+word&level=B2&page=3",
    );
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Page 4" })).toHaveAttribute(
      "href",
      "/lessons?q=key+word&level=B2&page=4",
    );
  });

  it("keeps a compact numbered range for long catalogues", () => {
    render(
      <CatalogPagination
        basePath="/lessons"
        dictionary={en}
        page={6}
        placement="bottom"
        totalItems={124}
        totalPages={11}
        params={{}}
      />,
    );

    expect(screen.getByRole("link", { name: "Page 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 5" })).toBeInTheDocument();
    expect(screen.getByText("6")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Page 7" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 11" })).toBeInTheDocument();
  });
});
