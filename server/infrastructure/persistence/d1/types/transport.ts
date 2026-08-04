import type { D1Result } from "./binding";
import type { D1Operation } from "./operations";

/** Transport contract shared by native binding and authenticated HTTP. */
export interface D1TransportClient {
  execute(operation: D1Operation): Promise<D1Result>;
  batch(operations: D1Operation[]): Promise<D1Result[]>;
}
