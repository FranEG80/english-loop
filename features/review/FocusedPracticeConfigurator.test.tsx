import { render, screen } from "@testing-library/react";
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

function renderConfigurator(initialNodeId = "future-forms") {
  const result = render(
    <FocusedPracticeConfigurator
      action={vi.fn()}
      copy={{ common: en.common, catalog: en.catalog, review: en.review }}
      initialNodeId={initialNodeId}
      locale="en"
      taxonomy={taxonomy}
    />,
  );
  return result.container;
}

describe("FocusedPracticeConfigurator", () => {
  it("restores a deep taxonomy path without flattening it into one select", () => {
    const container = renderConfigurator();

    expect(screen.getByRole("button", { name: "Grammar" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("combobox", { name: en.review.topicLabel })).toHaveValue("verb-tenses");
    expect(screen.getByRole("combobox", { name: en.review.subtopicLabel })).toHaveValue("future-forms");
    expect(screen.getByRole("combobox", { name: en.review.skillLabel })).toHaveValue("");
    expect(container.querySelector('input[name="taxonomyNodeId"]')).toHaveValue("future-forms");
    expect(screen.getAllByRole("option")).toHaveLength(6);
  });

  it("reveals one level at a time and resets descendants when the area changes", async () => {
    const user = userEvent.setup();
    const container = renderConfigurator("grammar");

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

  it("disables levels that have no content for the selected skill", async () => {
    const user = userEvent.setup();
    renderConfigurator();

    await user.selectOptions(
      screen.getByRole("combobox", { name: en.review.skillLabel }),
      "will-predictions",
    );

    expect(screen.getByRole("radio", { name: "B1" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "B2" })).toBeDisabled();
  });
});
