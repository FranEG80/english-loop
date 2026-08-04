import "server-only";
import { betterAuth } from "better-auth";
import { prisma } from "@/server/infrastructure/database/prisma-client";
import { config } from "@/server/infrastructure/config/config";
import { createD1BetterAuthAdapter } from "./d1-better-auth-adapter";
import { createD1Transport, type D1RuntimeOptions } from "../persistence/d1/d1-runtime";

export interface AuthRuntimeOptions {
  binding?: D1RuntimeOptions["binding"];
  fetch?: D1RuntimeOptions["fetch"];
  now?: D1RuntimeOptions["now"];
  nonce?: D1RuntimeOptions["nonce"];
}

function authDatabase(options: AuthRuntimeOptions) {
  if (config.databaseProvider !== "d1") return prisma;
  const transport = createD1Transport({ ...config, ...options });
  if (!transport) throw new Error("D1 auth requires a configured D1 transport");
  return createD1BetterAuthAdapter(transport);
}

/** Builds Better Auth against the configured persistence provider. */
export function createAuth(options: AuthRuntimeOptions = {}) {
  const database = authDatabase(options);

  return betterAuth({
    database,
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: config.authSessionExpiresInSeconds,
      updateAge: config.authSessionUpdateAgeSeconds,
      cookieCache: {
        enabled: true,
        maxAge: config.authCookieCacheMaxAgeSeconds,
      },
    },
    advanced: {
      cookiePrefix: "englishloop",
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.nodeEnv === "production",
      },
    },
  });
}

function unavailableBindingAuth(): ReturnType<typeof betterAuth> {
  return new Proxy({} as ReturnType<typeof betterAuth>, {
    get() {
      throw new Error("D1 binding auth must be created with createAuth({ binding: { DB } })");
    },
  });
}

/**
 * Configuración de Better Auth con email/contraseña y sesiones persistidas
 * en el proveedor seleccionado. Los tipos de Better Auth nunca salen de este módulo:
 * el core los traduce a `Actor` a través de `BetterAuthIdentityAdapter`.
 */
export const auth = config.databaseProvider === "d1" && config.d1Transport === "binding"
  ? unavailableBindingAuth()
  : createAuth();
