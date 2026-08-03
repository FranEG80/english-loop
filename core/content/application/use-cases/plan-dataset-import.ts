import type { ChecksumPort } from "../../ports/checksum-port";

export interface ImportPlanItem {
  id: string;
  kind: "lesson" | "activity" | "taxonomy";
  action: "create" | "update" | "unchanged" | "retire";
  checksum: string;
}

export interface ImportPlan {
  datasetVersion: string;
  globalChecksum: string;
  items: ImportPlanItem[];
  summary: {
    create: number;
    update: number;
    unchanged: number;
    retire: number;
  };
}

/** Calcula el checksum SHA-256 de un valor serializado. */
/**
 * Planifica la importación del dataset: compara versión y checksum con la
 * última importación y clasifica cada elemento como create/update/unchanged.
 */
export function planDatasetImport(
  datasetVersion: string,
  items: Array<{ id: string; kind: ImportPlanItem["kind"]; checksum: string }>,
  previousChecksums: Map<string, string>,
  checksumPort: ChecksumPort,
): ImportPlan {
  const planItems: ImportPlanItem[] = items.map((item) => {
    const previous = previousChecksums.get(item.id);
    let action: ImportPlanItem["action"];
    if (previous === undefined) action = "create";
    else if (previous === item.checksum) action = "unchanged";
    else action = "update";
    return { ...item, action };
  });

  const summary = {
    create: planItems.filter((item) => item.action === "create").length,
    update: planItems.filter((item) => item.action === "update").length,
    unchanged: planItems.filter((item) => item.action === "unchanged").length,
    retire: 0,
  };

  return {
    datasetVersion,
    globalChecksum: checksumPort.checksum({ datasetVersion, items }),
    items: planItems,
    summary,
  };
}
