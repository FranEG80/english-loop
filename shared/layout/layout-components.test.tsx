/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

vi.mock("next/image", () => ({ default: ({ alt = "", ...props }: Record<string, unknown>) => <img {...props} alt={String(alt)} /> }));
vi.mock("next/navigation", () => ({ usePathname: () => "/lessons", redirect: vi.fn() }));
vi.mock("./actions", () => ({ logoutAction: vi.fn() }));
vi.mock("./LanguageSwitcher", () => ({ LanguageSwitcher: () => <span>Language switcher</span> }));

import { LogoutButton } from "./LogoutButton";
import { MobileNav } from "./MobileNav";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import { PublicShell } from "./PublicShell";
import { Sidebar } from "./Sidebar";
import { WorkspaceShell } from "./WorkspaceShell";

const session = { name: "Alex", email: "alex@example.com", activeLevels: ["B1"] } as never;

describe("layout components", () => {
  it("renders public header/footer and shell landmarks", () => {
    render(<PublicShell dictionary={en} locale="en"><p>Content</p></PublicShell>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Content");
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("Language switcher")).toBeInTheDocument();
  });

  it("renders standalone public header and footer links", () => {
    render(<><PublicHeader dictionary={en} locale="es" /><PublicFooter dictionary={en} /></>);
    expect(screen.getAllByRole("link", { name: en.nav.login }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: en.nav.register }).length).toBeGreaterThan(0);
  });

  it("marks the current workspace item in both navigation variants", () => {
    render(<><MobileNav dictionary={en} /><Sidebar dictionary={en} session={session} /></>);
    expect(screen.getAllByRole("link", { current: "page" }).length).toBeGreaterThan(0);
  });

  it("composes the workspace shell and exposes logout affordance", () => {
    render(<WorkspaceShell dictionary={en} locale="es" session={session}><p>Workspace</p></WorkspaceShell>);
    expect(screen.getByRole("main")).toHaveTextContent("Workspace");
    expect(screen.getByRole("button", { name: en.nav.logout })).toBeInTheDocument();
  });

  it("supports compact logout presentation", () => {
    render(<LogoutButton label="Log out" compact theme="dark" />);
    expect(screen.getByRole("button", { name: "Log out" })).toHaveAttribute("title", "Log out");
    expect(screen.queryByText("Log out")).not.toBeInTheDocument();
  });
});
