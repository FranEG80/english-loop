import "server-only";
import { betterAuth } from "better-auth";
import { prisma } from "@/server/infrastructure/database/prisma-client";
import { config } from "@/server/infrastructure/config/config";

/**
 * Configuración de Better Auth con email/contraseña y sesiones persistidas
 * en base de datos. Los tipos de Better Auth nunca salen de este módulo:
 * el core los traduce a `Actor` a través de `BetterAuthIdentityAdapter`.
 */
export const auth = betterAuth({
  database: prisma,
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
