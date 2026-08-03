/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { Landing } from "./Landing";

vi.mock("next/image", () => ({ default: ({ alt = "", ...props }: Record<string, unknown>) => <img {...props} alt={String(alt)} /> }));
vi.mock("@/shared/layout/Mascot", () => ({ Mascot: () => <span aria-hidden="true" /> }));

describe("Landing", () => {
  it("renders localized hero calls to action", () => {
    render(<Landing dictionary={en} locale="en" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Keep your English");
    expect(screen.getAllByRole("link", { name: en.landing.heroCtaPrimary })[0]).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: en.landing.heroCtaSecondary })).toHaveAttribute("href", "/login");
  });
});
