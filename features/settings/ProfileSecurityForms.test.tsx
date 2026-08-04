import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useActionState = vi.hoisted(() => vi.fn());
vi.mock("react", async () => ({
  ...(await vi.importActual<typeof import("react")>("react")),
  useActionState,
}));

vi.mock("@/features/auth/actions", () => ({
  updateProfileAction: vi.fn(),
  changePasswordAction: vi.fn(),
}));

import { ProfileSecurityForms } from "./ProfileSecurityForms";

describe("ProfileSecurityForms", () => {
  beforeEach(() => {
    useActionState
      .mockReset()
      .mockReturnValueOnce([undefined, vi.fn(), false])
      .mockReturnValueOnce([undefined, vi.fn(), false]);
  });

  it("renders profile and password controls with accessible autocomplete hints", () => {
    render(<ProfileSecurityForms name="Alex" locale="en" />);

    expect(screen.getByLabelText("Display name")).toHaveValue("Alex");
    expect(screen.getByLabelText("Display name")).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText("Current password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText("New password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Repeat the new password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Save profile" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Change password" })).toBeEnabled();
  });

  it("translates the account controls for Spanish users", () => {
    render(<ProfileSecurityForms name="Alex" locale="es" />);

    expect(screen.getByRole("heading", { name: "Perfil" })).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña actual")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeInTheDocument();
  });

  it("renders server errors, success feedback and pending labels", () => {
    useActionState
      .mockReset()
      .mockReturnValueOnce([{ error: "Profile failed" }, vi.fn(), false])
      .mockReturnValueOnce([{ success: "Password saved" }, vi.fn(), true]);

    render(<ProfileSecurityForms name="Alex" locale="en" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Profile failed");
    expect(screen.getByRole("status")).toHaveTextContent("Password saved");
    expect(screen.getByRole("button", { name: "Updating…" })).toBeDisabled();
  });

  it("renders the opposite feedback combination", () => {
    useActionState
      .mockReset()
      .mockReturnValueOnce([{ success: "Profile saved" }, vi.fn(), true])
      .mockReturnValueOnce([{ error: "Password failed" }, vi.fn(), false]);

    render(<ProfileSecurityForms name="Alex" locale="es" />);

    expect(screen.getByRole("status")).toHaveTextContent("Profile saved");
    expect(screen.getByRole("alert")).toHaveTextContent("Password failed");
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });
});
