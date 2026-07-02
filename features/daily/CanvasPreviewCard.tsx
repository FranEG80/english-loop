import type { CanvasPreviewDto, Locale } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { CanvasSentenceMap } from "./CanvasSentenceMap";

export function CanvasPreviewCard({
  preview,
  locale,
  dictionary,
}: {
  preview: CanvasPreviewDto;
  locale: Locale;
  dictionary: Dictionary;
}) {
  return (
    <CanvasSentenceMap
      preview={preview}
      locale={locale}
      dictionary={dictionary}
    />
  );
}
