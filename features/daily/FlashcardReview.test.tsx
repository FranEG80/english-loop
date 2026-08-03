import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { FlashcardReview } from "./FlashcardReview";

describe("FlashcardReview", () => {
  it("reveals a card and cycles through the stack", async () => {
    const user = userEvent.setup();
    render(<FlashcardReview dictionary={en} stack={{ cards: [{ front: "front one", back: "back one" }, { front: "front two", back: "back two" }] } as never} />);
    await user.click(screen.getByRole("button", { name: /front one/ }));
    expect(screen.getByText("back one")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.daily.flashcardNext }));
    expect(screen.getByText("front two")).toBeInTheDocument();
  });
});
