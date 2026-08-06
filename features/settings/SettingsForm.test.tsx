import { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useActionState = vi.hoisted(() => vi.fn());
vi.mock("react", async () => ({
  ...(await vi.importActual<typeof import("react")>("react")),
  useActionState,
}));

vi.mock("@/features/settings/actions", () => ({
  updateSettingsAction: vi.fn(),
}));

import { SettingsForm } from "./SettingsForm";

const initialValues = {
  activeLevels: [],
  dailyGoal: 3,
  locale: "en" as const,
  reducedMotion: false,
};

function GoalControl() {
  const [goal, setGoal] = useState(3);

  return (
    <>
      <input type="hidden" name="dailyGoal" value={goal} />
      <button type="button" onClick={() => setGoal((value) => value + 1)}>
        Increase goal
      </button>
    </>
  );
}

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useActionState.mockReset().mockReturnValue([undefined, vi.fn(), false]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps save disabled until the form differs from its saved values", async () => {
    render(
      <SettingsForm
        initialValues={initialValues}
        locale="en"
        notice="Notice"
        saveLabel="Save"
      >
        <input
          aria-label="Language"
          name="locale"
          defaultValue="en"
        />
        <GoalControl />
      </SettingsForm>,
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    const language = screen.getByLabelText("Language");
    expect(saveButton).toBeDisabled();

    fireEvent.change(language, { target: { value: "es" } });
    expect(saveButton).toBeEnabled();

    fireEvent.change(language, { target: { value: "en" } });
    expect(saveButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Increase goal" }));
      await Promise.resolve();
    });
    expect(saveButton).toBeEnabled();
  });

  it("shows successful saves in a temporary toast", () => {
    useActionState.mockReturnValue([
      { success: "Settings saved." },
      vi.fn(),
      false,
    ]);

    render(
      <SettingsForm
        initialValues={initialValues}
        locale="en"
        notice="Changes apply to this account."
        saveLabel="Save"
      >
        <input aria-label="Language" />
      </SettingsForm>,
    );

    expect(
      screen.getByRole("form", { name: "Learning settings" }),
    ).toHaveAttribute("aria-busy", "false");
    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Settings saved.");
    expect(toast).toHaveClass("fixed");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("disables the submit button and shows progress while saving", () => {
    useActionState.mockReturnValue([undefined, vi.fn(), true]);

    render(
      <SettingsForm
        initialValues={{ ...initialValues, locale: "es" }}
        locale="es"
        notice="Aviso"
        saveLabel="Guardar"
      >
        <input aria-label="Idioma" />
      </SettingsForm>,
    );

    expect(screen.getByRole("form", { name: "Ajustes de aprendizaje" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });

  it("shows errors in a dismissible toast and keeps retry enabled", () => {
    useActionState.mockReturnValue([
      { error: "Settings could not be saved. Please try again." },
      vi.fn(),
      false,
    ]);

    render(
      <SettingsForm
        initialValues={initialValues}
        locale="en"
        notice="Notice"
        saveLabel="Save"
      >
        <input aria-label="Language" />
      </SettingsForm>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Settings could not be saved. Please try again.",
    );
    expect(alert).toHaveClass("fixed");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
