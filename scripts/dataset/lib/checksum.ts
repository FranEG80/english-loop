import { createHash } from "node:crypto";
import type { ChecksumPort } from "@/core/content/ports/checksum-port";

export const sha256Checksum: ChecksumPort = {
  checksum(value: unknown): string {
    return createHash("sha256").update(JSON.stringify(value)).digest("hex");
  },
};
