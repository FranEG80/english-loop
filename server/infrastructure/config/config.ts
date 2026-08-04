import "server-only";
import { loadConfig } from "./config-core";

export * from "./config-core";

/** Singleton de configuración del runtime de servidor. */
export const config = loadConfig();
