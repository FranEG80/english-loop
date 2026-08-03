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
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // renovar cada 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
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
