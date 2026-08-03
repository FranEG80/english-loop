import { describe, expect, it, vi } from "vitest";

const ports = vi.hoisted(() => ({ logout: vi.fn(), setLocale: vi.fn() }));
vi.mock("@/adapters/adapter-factory", () => ({
  getAuthPort: () => ({ logout: ports.logout }),
  getLocalePort: () => ({ setLocale: ports.setLocale }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { revalidatePath } from "next/cache";
import { logoutAction, setLocaleAction } from "./actions";

describe("shared layout actions", () => {
  it("logs out and redirects to the public entry point", async () => {
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/");
    expect(ports.logout).toHaveBeenCalledOnce();
  });

  it("persists locale and invalidates the requested path", async () => {
    await setLocaleAction("es", "/workspace");
    expect(ports.setLocale).toHaveBeenCalledWith("es");
    expect(revalidatePath).toHaveBeenCalledWith("/workspace");
  });
});
