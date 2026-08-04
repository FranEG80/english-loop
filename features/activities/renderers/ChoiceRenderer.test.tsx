import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { ChoiceRenderer } from "./ChoiceRenderer";

const base = {
  id: "a1", level: "B1" as const, taxonomyNodeId: "topic", interactionMode: "standard" as const,
  question: "Choose an answer", options: [{ id: "a", label: "First" }, { id: "b", label: "Second" }],
};

describe("ChoiceRenderer", () => {
  it("selects one option and submits a single response", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChoiceRenderer activity={{ ...base, type: "single_choice" }} dictionary={en} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("radio", { name: /First/iu }));
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: "single", value: "a" });
  });

  it("toggles multiple options and does not submit while empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChoiceRenderer activity={{ ...base, type: "multiple_choice" }} dictionary={en} onSubmit={onSubmit} />);
    const submit = screen.getByRole("button", { name: en.daily.submitAnswer });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /First/iu }));
    await user.click(screen.getByRole("checkbox", { name: /Second/iu }));
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith({ kind: "multiple", value: ["a", "b"] });
  });

  it("guards disabled controls and removes an already selected option", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChoiceRenderer activity={{ ...base, type: "multiple_choice" }} dictionary={en} onSubmit={onSubmit} />);
    const first = screen.getByRole("checkbox", { name: /First/iu });
    await user.click(first);
    await user.click(first);
    const submit = screen.getByRole("button", { name: en.daily.submitAnswer });
    submit.disabled = false;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();

    const disabledSubmit = vi.fn();
    render(<ChoiceRenderer activity={{ ...base, type: "single_choice" }} dictionary={en} onSubmit={disabledSubmit} disabled />);
    const disabledOption = screen.getByRole("radio", { name: /First/iu });
    disabledOption.disabled = false;
    fireEvent.click(disabledOption);
    expect(disabledSubmit).not.toHaveBeenCalled();
  });
});
