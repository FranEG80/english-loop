/**
 * Compatibility facade. SQL is implemented by one module per persistence
 * feature under `operations/`; this file intentionally contains no queries.
 */
export { prepareD1Operation, prepareCompositeD1Operation } from "./operations";
export type { PreparedOperation } from "./operations";
