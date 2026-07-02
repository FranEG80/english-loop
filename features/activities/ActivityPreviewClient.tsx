"use client";

import { useState } from "react";
import type {
  ActivityQuestionDto,
  ActivityResponseValue,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { ActivityRenderer } from "./ActivityRenderer";

export function ActivityPreviewClient({
  activity,
  dictionary,
}: {
  activity: ActivityQuestionDto;
  dictionary: Dictionary;
}) {
  const [response, setResponse] = useState<ActivityResponseValue | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <ActivityRenderer
        activity={activity}
        dictionary={dictionary}
        onSubmit={setResponse}
        disabled={Boolean(response)}
      />
      <p className="text-sm text-foreground/70" role="status">
        {response
          ? `${dictionary.catalog.previewNotice} ✓`
          : dictionary.catalog.previewNotice}
      </p>
      {response ? (
        <button
          type="button"
          onClick={() => setResponse(null)}
          className="h-12 w-fit rounded-control border border-border-interactive px-4 font-medium"
        >
          {dictionary.common.retry}
        </button>
      ) : null}
    </div>
  );
}
