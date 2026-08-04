import { z } from "zod";

export const contentSourceSchema = z.enum(["dataset", "database"]);
export const databaseProviderSchema = z.enum([
  "sqlite",
  "d1",
  "postgresql",
  "mariadb",
]);
export const d1TransportSchema = z.enum(["binding", "http"]);

export type ContentSource = z.infer<typeof contentSourceSchema>;
export type DatabaseProvider = z.infer<typeof databaseProviderSchema>;
export type D1Transport = z.infer<typeof d1TransportSchema>;

export interface AppConfig {
  databaseUrl: string;
  contentSource: ContentSource;
  databaseProvider: DatabaseProvider;
  d1Transport: D1Transport;
  d1HttpUrl: string | null;
  d1HttpToken: string | null;
  authSessionExpiresInSeconds: number;
  authSessionUpdateAgeSeconds: number;
  authCookieCacheMaxAgeSeconds: number;
  attemptRateLimitWindowMs: number;
  attemptRateLimitMax: number;
  authRateLimitWindowMs: number;
  authRateLimitMax: number;
  prismaTransactionRetryMax: number;
  publicPageDefaultLimit: number;
  publicPageMaxLimit: number;
  httpMaxRequestBodyBytes: number;
  httpMaxResponseBodyBytes: number;
  betterAuthSecret: string;
  betterAuthUrl: string;
  nodeEnv: string;
}

const DEFAULT_AUTH_SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_AUTH_SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;
const DEFAULT_AUTH_COOKIE_CACHE_MAX_AGE_SECONDS = 60 * 5;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_ATTEMPT_RATE_LIMIT_MAX = 30;
const DEFAULT_AUTH_RATE_LIMIT_MAX = 10;
const DEFAULT_PRISMA_TRANSACTION_RETRY_MAX = 2;
const DEFAULT_PUBLIC_PAGE_LIMIT = 25;
const DEFAULT_PUBLIC_PAGE_MAX_LIMIT = 100;
const DEFAULT_HTTP_MAX_REQUEST_BODY_BYTES = 1_048_576;
const DEFAULT_HTTP_MAX_RESPONSE_BODY_BYTES = 1_048_576;

function positiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function nonNegativeIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

/** Carga y valida configuración desde variables de entorno. */
export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const contentSourceResult = contentSourceSchema.safeParse(
    process.env.CONTENT_SOURCE ?? "dataset",
  );
  const databaseProviderResult = databaseProviderSchema.safeParse(
    process.env.DATABASE_PROVIDER ?? "sqlite",
  );
  const d1TransportResult = d1TransportSchema.safeParse(
    process.env.D1_TRANSPORT ?? "binding",
  );
  if (!contentSourceResult.success) {
    throw new Error("CONTENT_SOURCE must be dataset or database");
  }
  if (!databaseProviderResult.success) {
    throw new Error(
      "DATABASE_PROVIDER must be sqlite, d1, postgresql, or mariadb",
    );
  }
  if (!d1TransportResult.success) {
    throw new Error("D1_TRANSPORT must be binding or http");
  }

  const contentSource = contentSourceResult.data;
  const databaseProvider = databaseProviderResult.data;
  const d1Transport = d1TransportResult.data;
  const d1HttpUrl = process.env.D1_HTTP_URL ?? null;
  const d1HttpToken = process.env.D1_HTTP_TOKEN ?? null;

  if (databaseProvider === "d1" && d1Transport === "http" && !d1HttpUrl) {
    throw new Error("D1_HTTP_URL is required when D1_TRANSPORT is http");
  }
  if (databaseProvider === "d1" && d1Transport === "http" && !d1HttpToken) {
    throw new Error("D1_HTTP_TOKEN is required when D1_TRANSPORT is http");
  }
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
  const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const authSessionExpiresInSeconds = positiveIntegerEnv(
    "AUTH_SESSION_EXPIRES_IN_SECONDS",
    DEFAULT_AUTH_SESSION_EXPIRES_IN_SECONDS,
  );
  const authSessionUpdateAgeSeconds = positiveIntegerEnv(
    "AUTH_SESSION_UPDATE_AGE_SECONDS",
    DEFAULT_AUTH_SESSION_UPDATE_AGE_SECONDS,
  );
  const authCookieCacheMaxAgeSeconds = positiveIntegerEnv(
    "AUTH_COOKIE_CACHE_MAX_AGE_SECONDS",
    DEFAULT_AUTH_COOKIE_CACHE_MAX_AGE_SECONDS,
  );
  const attemptRateLimitWindowMs = positiveIntegerEnv(
    "ATTEMPT_RATE_LIMIT_WINDOW_MS",
    DEFAULT_RATE_LIMIT_WINDOW_MS,
  );
  const attemptRateLimitMax = positiveIntegerEnv(
    "ATTEMPT_RATE_LIMIT_MAX",
    DEFAULT_ATTEMPT_RATE_LIMIT_MAX,
  );
  const authRateLimitWindowMs = positiveIntegerEnv(
    "AUTH_RATE_LIMIT_WINDOW_MS",
    DEFAULT_RATE_LIMIT_WINDOW_MS,
  );
  const authRateLimitMax = positiveIntegerEnv(
    "AUTH_RATE_LIMIT_MAX",
    DEFAULT_AUTH_RATE_LIMIT_MAX,
  );
  const prismaTransactionRetryMax = nonNegativeIntegerEnv(
    "PRISMA_TRANSACTION_RETRY_MAX",
    DEFAULT_PRISMA_TRANSACTION_RETRY_MAX,
  );
  const publicPageDefaultLimit = positiveIntegerEnv(
    "PUBLIC_PAGE_DEFAULT_LIMIT",
    DEFAULT_PUBLIC_PAGE_LIMIT,
  );
  const publicPageMaxLimit = positiveIntegerEnv(
    "PUBLIC_PAGE_MAX_LIMIT",
    DEFAULT_PUBLIC_PAGE_MAX_LIMIT,
  );
  if (publicPageDefaultLimit > publicPageMaxLimit) {
    throw new Error("PUBLIC_PAGE_DEFAULT_LIMIT must not exceed PUBLIC_PAGE_MAX_LIMIT");
  }
  const httpMaxRequestBodyBytes = positiveIntegerEnv(
    "HTTP_MAX_REQUEST_BODY_BYTES",
    DEFAULT_HTTP_MAX_REQUEST_BODY_BYTES,
  );
  const httpMaxResponseBodyBytes = positiveIntegerEnv(
    "HTTP_MAX_RESPONSE_BODY_BYTES",
    DEFAULT_HTTP_MAX_RESPONSE_BODY_BYTES,
  );

  if (nodeEnv === "production" && !betterAuthSecret) {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }

  return {
    databaseUrl,
    contentSource,
    databaseProvider,
    d1Transport,
    d1HttpUrl,
    d1HttpToken,
    authSessionExpiresInSeconds,
    authSessionUpdateAgeSeconds,
    authCookieCacheMaxAgeSeconds,
    attemptRateLimitWindowMs,
    attemptRateLimitMax,
    authRateLimitWindowMs,
    authRateLimitMax,
    prismaTransactionRetryMax,
    publicPageDefaultLimit,
    publicPageMaxLimit,
    httpMaxRequestBodyBytes,
    httpMaxResponseBodyBytes,
    betterAuthSecret: betterAuthSecret ?? "dev-secret",
    betterAuthUrl,
    nodeEnv,
  };
}
