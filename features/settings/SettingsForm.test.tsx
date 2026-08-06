import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateSettingsAction = vi.hoisted(() => vi.fn());
vi.mock("@/features/settings/actions", () => ({
  updateSettingsAction,
}));

import { SettingsForm } from "./SettingsForm";
import { DailyGoalStepper } from "./DailyGoalStepper";

const initialValues = {
  activeLevels: [],
  dailyGoal: 3,
  locale: "en" as const,
  reducedMotion: false,
};

describe("SettingsForm", () => {
  beforeEach(() => {
    updateSettingsAction.mockReset().mockResolvedValue({
      success: "Settings saved.",
    });
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
        <DailyGoalStepper defaultValue={3} label="Daily goal" />
      </SettingsForm>,
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    const language = screen.getByLabelText("Language");
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveClass("cursor-not-allowed");
    expect(saveButton).not.toHaveClass("cursor-wait");

    fireEvent.change(language, { target: { value: "es" } });
    expect(saveButton).toBeEnabled();
    expect(saveButton).not.toHaveClass("cursor-not-allowed");
    expect(saveButton).not.toHaveClass("cursor-wait");

    fireEvent.change(language, { target: { value: "en" } });
    expect(saveButton).toBeDisabled();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Daily goal: +1" }));
      await Promise.resolve();
    });
    expect(saveButton).toBeEnabled();
  });

  it("disables save again after persisting the changes", async () => {
    render(
      <SettingsForm
        initialValues={initialValues}
        locale="en"
        notice="Changes apply to this account."
        saveLabel="Save"
      >
        <input
          aria-label="Language"
          name="locale"
          defaultValue="en"
        />
      </SettingsForm>,
    );

    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "es" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await Promise.resolve();
    });

    expect(updateSettingsAction).toHaveBeenCalledOnce();
    expect(updateSettingsAction.mock.calls[0]?.[0]).toBeInstanceOf(FormData);
    expect(
      screen.getByRole("form", { name: "Learning settings" }),
    ).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "cursor-not-allowed",
    );
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveClass(
      "cursor-wait",
    );

  });

  it("disables the submit button and shows progress while saving", async () => {
    let resolveSave: ((value: { success: string }) => void) | undefined;
    updateSettingsAction.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );

    render(
      <SettingsForm
        initialValues={{ ...initialValues, locale: "es" }}
        locale="es"
        notice="Aviso"
        saveLabel="Guardar"
      >
        <input
          aria-label="Idioma"
          name="locale"
          defaultValue="es"
        />
      </SettingsForm>,
    );

    fireEvent.change(screen.getByLabelText("Idioma"), {
      target: { value: "en" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByRole("form", { name: "Ajustes de aprendizaje" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando…" })).toHaveClass(
      "cursor-wait",
    );
    expect(screen.getByRole("button", { name: "Guardando…" })).not.toHaveClass(
      "cursor-not-allowed",
    );

    await act(async () => {
      resolveSave?.({ success: "Settings saved." });
      await Promise.resolve();
    });
  });

  it("re-enables save without rendering a toast when persistence fails", async () => {
    updateSettingsAction.mockResolvedValue({
      error: "Settings could not be saved. Please try again.",
    });

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
      </SettingsForm>,
    );

    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "es" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await Promise.resolve();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
