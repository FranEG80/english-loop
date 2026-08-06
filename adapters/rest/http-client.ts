const API_BASE_PATH = "/api/v1";
const DEFAULT_SERVER_ORIGIN = "http://127.0.0.1:3000";

export class RestApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "RestApiError";
  }
}

interface ServerRequestContext {
  origin: string;
  cookie?: string;
}

async function getServerRequestContext(): Promise<ServerRequestContext> {
  const configuredOrigin = process.env.BETTER_AUTH_URL ?? DEFAULT_SERVER_ORIGIN;
  if (typeof window !== "undefined") return { origin: configuredOrigin };

  const { headers } = await import("next/headers");
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host");
  if (!host) {
    return {
      origin: new URL(configuredOrigin).origin,
      cookie: incomingHeaders.get("cookie") ?? undefined,
    };
  }

  const forwardedProtocol = incomingHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || new URL(configuredOrigin).protocol.replace(":", "");
  return {
    origin: `${protocol}://${host}`,
    cookie: incomingHeaders.get("cookie") ?? undefined,
  };
}

/** Ejecuta una petición contra un Route Handler desde navegador o servidor. */
export async function restFetch(path: string, init?: RequestInit): Promise<Response> {
  const context = await getServerRequestContext();
  const requestHeaders = new Headers(init?.headers);
  if (!requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (context.cookie && !requestHeaders.has("cookie")) {
    requestHeaders.set("cookie", context.cookie);
  }

  const url = typeof window === "undefined"
    ? new URL(path, context.origin).toString()
    : path;
  return fetch(url, { ...init, headers: requestHeaders });
}

export async function restRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await restFetch(`${API_BASE_PATH}${path}`, init);
  const payload = response.status === 204
    ? undefined
    : await response.json().catch(() => undefined) as unknown;
  if (!response.ok) {
    const apiError = parseApiError(payload);
    throw new RestApiError(
      apiError?.message ??
        `La petición a "${path}" falló con estado ${response.status}.`,
      response.status,
      apiError?.code,
      apiError?.fieldErrors,
    );
  }
  if (response.status === 204) return undefined as TResponse;
  return payload as TResponse;
}

function parseApiError(payload: unknown): {
  code?: string;
  fieldErrors: Record<string, string[]>;
  message?: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const error = "error" in payload
    ? (payload as { error?: unknown }).error
    : null;
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    fieldErrors:
      record.fieldErrors && typeof record.fieldErrors === "object"
        ? (record.fieldErrors as Record<string, string[]>)
        : {},
  };
}
