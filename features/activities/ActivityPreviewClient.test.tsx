import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import type { AttemptFeedbackDto } from "@/core/models";

vi.mock("./ActivityRenderer", () => ({
  ActivityRenderer: ({
    onSubmit,
    disabled,
  }: {
    onSubmit: (value: unknown) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSubmit({ kind: "text", value: "answer" })}
    >
      Answer
    </button>
  ),
}));

import { ActivityPreviewClient } from "./ActivityPreviewClient";

const activity = {
  id: "activity-1",
  level: "B1",
  taxonomyNodeId: "grammar",
  type: "gap_fill",
  skillFocus: "fill_blank",
  presentation: "gap_fill",
  instructions: "Complete.",
} as never;

const feedback: AttemptFeedbackDto = {
  attemptId: "preview",
  activityId: "activity-1",
  isCorrect: false,
  score: 0,
  correctAnswer: "speak",
  normalizedResponse: { kind: "text", value: "answer" },
  items: [],
  explanation: "El presente simple usa el infinitivo.",
  nextReviewAt: null,
  submittedAt: new Date(0).toISOString(),
};

function mockCheck(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, ...response }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ActivityPreviewClient", () => {
  it("corrige la respuesta y muestra la explicación", async () => {
    mockCheck({ json: async () => feedback });
    render(<ActivityPreviewClient activity={activity} dictionary={en} />);

    await userEvent.click(screen.getByRole("button", { name: "Answer" }));

    await waitFor(() =>
      expect(screen.getByText("El presente simple usa el infinitivo.")).toBeInTheDocument(),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/activities/activity-1/check",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("avisa de que corrige pero no cuenta como práctica", () => {
    mockCheck({ json: async () => feedback });
    render(<ActivityPreviewClient activity={activity} dictionary={en} />);

    expect(screen.getByRole("status")).toHaveTextContent(en.catalog.previewNotice);
  });

  it("permite reintentar tras corregir", async () => {
    mockCheck({ json: async () => feedback });
    render(<ActivityPreviewClient activity={activity} dictionary={en} />);

    await userEvent.click(screen.getByRole("button", { name: "Answer" }));
    const retry = await screen.findByRole("button", { name: en.common.retry });

    await userEvent.click(retry);
    expect(screen.queryByRole("button", { name: en.common.retry })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Answer" })).toBeEnabled();
  });

  it("avisa cuando la corrección falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    render(<ActivityPreviewClient activity={activity} dictionary={en} />);

    await userEvent.click(screen.getByRole("button", { name: "Answer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(en.states.errorTitle);
  });
});
