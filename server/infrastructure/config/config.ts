import "server-only";

export interface AppConfig {
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  nodeEnv: string;
}

/**
 * Configuración centralizada. Valida las variables de entorno al arrancar.
 * Ningún otro módulo debe leer `process.env` directamente.
 */
export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
  const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "production" && !betterAuthSecret) {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }

  return {
    databaseUrl,
    betterAuthSecret: betterAuthSecret ?? "dev-secret",
    betterAuthUrl,
    nodeEnv,
  };
}

/** Singleton de configuración. */
export const config = loadConfig();
