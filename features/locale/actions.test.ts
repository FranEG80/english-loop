import { describe, expect, it, vi } from "vitest";

const ports = vi.hoisted(() => ({ setLocale: vi.fn() }));
vi.mock("@/adapters/adapter-factory", () => ({ getLocalePort: () => ports }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { setLocaleAction } from "./actions";

describe("locale server action", () => {
  it("persists the locale and revalidates the current path", async () => {
    await setLocaleAction("en", "/settings");
    expect(ports.setLocale).toHaveBeenCalledWith("en");
    const { revalidatePath } = await import("next/cache");
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
  });
});
