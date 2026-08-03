import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

vi.mock("./actions", () => ({ loginAction: vi.fn() }));

import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renders labelled credentials and the submit action", () => {
    render(<LoginForm dictionary={en} />);
    expect(screen.getByLabelText(en.auth.emailLabel)).toHaveValue("alex@example.com");
    expect(screen.getByLabelText(en.auth.passwordLabel)).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: en.auth.submitLogin })).toBeEnabled();
  });
});
