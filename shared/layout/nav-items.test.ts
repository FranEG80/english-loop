import { describe, expect, it } from "vitest";
import { WORKSPACE_NAV_ITEMS, navLabel } from "./nav-items";
import { getDictionary } from "@/shared/i18n";

describe("workspace navigation", () => {
  it("keeps unique routes and resolves labels from the dictionary", () => {
    const hrefs = WORKSPACE_NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(navLabel(getDictionary("en"), "settings")).toBe(getDictionary("en").nav.settings);
    expect(WORKSPACE_NAV_ITEMS.every((item) => item.Icon)).toBe(true);
  });
});
