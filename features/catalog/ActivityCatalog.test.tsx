/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";
import { ActivityCatalog } from "./ActivityCatalog";

vi.mock("next/image", () => ({ default: ({ alt = "", ...props }: Record<string, unknown>) => <img {...props} alt={String(alt)} /> }));

const activity = { id: "activity-1", level: "B1" as const, taxonomyNodeId: "grammar", type: "true_false" as const, skillFocus: "true_false", presentation: "true_false" as const, instructions: "Decide.", statement: "Is this true?" };

describe("ActivityCatalog", () => {
  it("renders an empty state when there are no activities", () => {
    render(<ActivityCatalog activities={[]} dictionary={en} />);
    expect(screen.getByText(en.catalog.noResults)).toBeInTheDocument();
  });

  it("renders the activity type and destination link", () => {
    render(<ActivityCatalog activities={[activity]} dictionary={en} />);

    expect(screen.getByRole("heading", { name: "Activity 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.catalog.openActivity })).toHaveAttribute(
      "href",
      "/activities/activity-1",
    );
  });

  it("etiqueta el tipo y el formato con el diccionario, no con el identificador interno", () => {
    render(<ActivityCatalog activities={[activity]} dictionary={en} />);

    expect(screen.getByText(en.activityTypes.true_false)).toBeInTheDocument();
    expect(
      screen.getByText(`${en.catalog.presentation}: ${en.activityPresentations.true_false}`),
    ).toBeInTheDocument();
    expect(screen.queryByText("true_false")).not.toBeInTheDocument();
  });
});
