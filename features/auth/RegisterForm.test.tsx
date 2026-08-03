import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

vi.mock("./actions", () => ({ registerAction: vi.fn() }));

import { RegisterForm } from "./RegisterForm";

describe("RegisterForm", () => {
  it("renders the complete registration form with autocomplete hints", () => {
    render(<RegisterForm dictionary={en} />);
    expect(screen.getByLabelText(en.auth.nameLabel)).toHaveAttribute("autocomplete", "name");
    expect(screen.getByLabelText(en.auth.emailLabel)).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText(en.auth.passwordLabel)).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByRole("button", { name: en.auth.submitRegister })).toBeInTheDocument();
  });
});
