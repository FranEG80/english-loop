import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

vi.mock("./ActivityRenderer", () => ({
  ActivityRenderer: ({ onSubmit, disabled }: { onSubmit: (value: unknown) => void; disabled?: boolean }) => (
    <button type="button" disabled={disabled} onClick={() => onSubmit({ kind: "text", value: "answer" })}>
      Answer
    </button>
  ),
}));

import { ActivityPreviewClient } from "./ActivityPreviewClient";

const activity = {
  id: "activity-1",
  level: "B1",
  taxonomyNodeId: "grammar",
  type: "fill_blank",
  interactionMode: "standard",
  textWithGap: "I ___ English.",
} as never;

describe("ActivityPreviewClient", () => {
  it("shows completion feedback and lets the learner retry", async () => {
    const user = userEvent.setup();
    render(<ActivityPreviewClient activity={activity} dictionary={en} />);

    expect(screen.getByRole("status")).toHaveTextContent(en.catalog.previewNotice);
    await user.click(screen.getByRole("button", { name: "Answer" }));
    expect(screen.getByRole("status")).toHaveTextContent(`${en.catalog.previewNotice} ✓`);
    expect(screen.getByRole("button", { name: en.common.retry })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: en.common.retry }));
    expect(screen.getByRole("status")).toHaveTextContent(en.catalog.previewNotice);
    expect(screen.queryByRole("button", { name: en.common.retry })).not.toBeInTheDocument();
  });
});
