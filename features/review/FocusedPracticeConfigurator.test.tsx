import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TaxonomyNodeDto } from "@/core/models";
import { en } from "@/shared/i18n/dictionaries/en";
import { FocusedPracticeConfigurator } from "./FocusedPracticeConfigurator";

const taxonomy: TaxonomyNodeDto[] = [
  {
    id: "grammar",
    type: "category",
    label: { en: "Grammar", es: "Gramática" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "verb-tenses",
        type: "topic",
        label: { en: "Verb tenses", es: "Tiempos verbales" },
        levels: ["B1", "B2"],
        children: [
          {
            id: "future-forms",
            type: "subtopic",
            label: { en: "Future forms", es: "Formas de futuro" },
            levels: ["B1", "B2"],
            children: [
              {
                id: "will-predictions",
                type: "skill",
                label: { en: "Will for predictions", es: "Will para predicciones" },
                levels: ["B1"],
                children: [],
              },
              {
                id: "future-perfect",
                type: "skill",
                label: {
                  en: "Future perfect B2",
                  es: "Futuro perfecto B2",
                },
                levels: ["B2"],
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "vocabulary",
    type: "category",
    label: { en: "Vocabulary", es: "Vocabulario" },
    levels: ["B1", "B2"],
    children: [
      {
        id: "daily-life",
        type: "topic",
        label: { en: "Daily life", es: "Vida diaria" },
        levels: ["B1"],
        children: [],
      },
    ],
  },
];

function renderConfigurator(
  initialNodeId = "future-forms",
  action: (
    previousState: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }> = vi.fn(async () => ({})),
) {
  const loadAvailability = vi.fn(async (taxonomyNodeId: string) =>
    (["B1", "B2", "both"] as const).map((level) => ({
      nodeId: taxonomyNodeId,
      level,
      availableActivityCount:
        taxonomyNodeId === "will-predictions" ? 2 : 12,
      minRequiredActivities: 5,
      isEligible: taxonomyNodeId !== "will-predictions",
    })),
  );
  const result = render(
    <FocusedPracticeConfigurator
      action={action}
      copy={{ common: en.common, catalog: en.catalog, review: en.review }}
      initialNodeId={initialNodeId}
      loadAvailability={loadAvailability}
      locale="en"
      taxonomy={taxonomy}
    />,
  );
  return { action, container: result.container, loadAvailability };
}

describe("FocusedPracticeConfigurator", () => {
  it("restores a deep taxonomy path without flattening it into one select", () => {
    const { container } = renderConfigurator();

    expect(screen.getByRole("button", { name: "Grammar" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: en.review.topicLabel })).toHaveValue("verb-tenses");
    expect(screen.getByRole("combobox", { name: en.review.subtopicLabel })).toHaveValue("future-forms");
    expect(screen.getByRole("combobox", { name: en.review.skillLabel })).toHaveValue("");
    expect(container.querySelector('input[name="taxonomyNodeId"]')).toHaveValue("future-forms");
    expect(screen.getAllByRole("option")).toHaveLength(7);
  });

  it("reveals one level at a time and resets descendants when the area changes", async () => {
    const user = userEvent.setup();
    const { container } = renderConfigurator("grammar");

    expect(screen.getByRole("combobox", { name: en.review.topicLabel })).toHaveValue("");
    expect(screen.queryByRole("combobox", { name: en.review.subtopicLabel })).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: en.review.topicLabel }),
      "verb-tenses",
    );
    expect(container.querySelector('input[name="taxonomyNodeId"]')).toHaveValue("verb-tenses");
    expect(screen.getByRole("combobox", { name: en.review.subtopicLabel })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vocabulary" }));
    expect(container.querySelector('input[name="taxonomyNodeId"]')).toHaveValue("vocabulary");
    expect(screen.getByRole("button", { name: "Vocabulary" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("combobox", { name: en.review.subtopicLabel })).not.toBeInTheDocument();
  });

  it("keeps global levels available while validating the selected skill", async () => {
    const user = userEvent.setup();
    renderConfigurator();

    await user.selectOptions(
      screen.getByRole("combobox", { name: en.review.skillLabel }),
      "will-predictions",
    );

    expect(screen.getByRole("radio", { name: "B1" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "B2" })).toBeEnabled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: en.common.start })).toBeDisabled(),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This selection has 2 activities and you requested 5",
    );
  });

  it("filters taxonomy options by level and clears an incompatible selection", async () => {
    const user = userEvent.setup();
    const { container } = renderConfigurator();
    const skill = screen.getByRole("combobox", {
      name: en.review.skillLabel,
    });

    await user.selectOptions(skill, "future-perfect");
    expect(container.querySelector('input[name="taxonomyNodeId"]')).toHaveValue(
      "future-perfect",
    );

    await user.click(screen.getByRole("radio", { name: "B1" }));

    expect(skill).toHaveValue("");
    expect(
      screen.queryByRole("option", { name: "Future perfect B2" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Will for predictions" }),
    ).toBeInTheDocument();
    expect(container.querySelector('input[name="taxonomyNodeId"]')).toHaveValue(
      "future-forms",
    );

    await user.click(
      screen.getByRole("radio", { name: en.catalog.allLevels }),
    );
    expect(
      screen.getByRole("option", { name: "Future perfect B2" }),
    ).toBeInTheDocument();
  });

  it("submits the selected level instead of falling back to both", async () => {
    const user = userEvent.setup();
    const action = vi.fn<
      (
        previousState: { error?: string },
        formData: FormData,
      ) => Promise<{ error?: string }>
    >(async () => ({}));
    renderConfigurator("grammar", action);

    await user.click(screen.getByRole("radio", { name: "B1" }));
    const start = screen.getByRole("button", { name: en.common.start });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const submittedForm = action.mock.calls[0]?.[1];
    expect(submittedForm?.get("taxonomyNodeId")).toBe("grammar");
    expect(submittedForm?.get("level")).toBe("B1");
    expect(submittedForm?.get("sessionSize")).toBe("5");
  });

  it("checks the API-backed availability before enabling a session", async () => {
    const user = userEvent.setup();
    const { loadAvailability } = renderConfigurator("grammar");

    await waitFor(() =>
      expect(loadAvailability).toHaveBeenCalledWith("grammar"),
    );
    expect(screen.getByRole("button", { name: en.common.start })).toBeEnabled();

    await user.click(screen.getByRole("radio", { name: "20 activities" }));
    expect(screen.getByRole("button", { name: en.common.start })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This selection has 12 activities and you requested 20",
    );
  });

  it("renders a recoverable form error when run creation is rejected", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => ({
      error: "The practice session could not be created.",
    }));
    renderConfigurator("grammar", action);

    const start = screen.getByRole("button", { name: en.common.start });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The practice session could not be created.",
    );
  });
});
