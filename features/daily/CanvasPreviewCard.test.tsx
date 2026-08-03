import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { en } from "@/shared/i18n/dictionaries/en";

const canvasSentenceMap = vi.hoisted(() => vi.fn(() => <div data-testid="canvas-map" />));
vi.mock("./CanvasSentenceMap", () => ({ CanvasSentenceMap: canvasSentenceMap }));

import { CanvasPreviewCard } from "./CanvasPreviewCard";

describe("CanvasPreviewCard", () => {
  it("passes preview, locale and dictionary to the interactive map", () => {
    const preview = { title: { en: "Title", es: "Título" }, description: { en: "Description", es: "Descripción" } } as never;
    const { getByTestId } = render(<CanvasPreviewCard preview={preview} locale="en" dictionary={en} />);
    expect(getByTestId("canvas-map")).toBeInTheDocument();
    expect(canvasSentenceMap).toHaveBeenCalledWith(expect.objectContaining({ preview, locale: "en", dictionary: en }), undefined);
  });
});
