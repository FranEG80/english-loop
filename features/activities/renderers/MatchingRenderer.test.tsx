import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { MatchingRenderer } from "./MatchingRenderer";

describe("MatchingRenderer", () => {
  it("pairs both columns and submits the ordered pairs", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MatchingRenderer activity={{ id: "a", level: "B1", taxonomyNodeId: "topic", interactionMode: "matching_pairs", type: "matching", leftItems: [{ id: "l1", label: "Left" }, { id: "l2", label: "Another" }], rightItems: [{ id: "r1", label: "Right" }, { id: "r2", label: "Other" }] }} dictionary={en} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Left" }));
    await user.click(screen.getByRole("button", { name: "Right" }));
    await user.click(screen.getByRole("button", { name: "Another" }));
    await user.click(screen.getByRole("button", { name: "Other" }));
    await user.click(screen.getByRole("button", { name: en.daily.submitAnswer }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: "pairs", value: [{ leftId: "l1", rightId: "r1" }, { leftId: "l2", rightId: "r2" }] });
  });
});
