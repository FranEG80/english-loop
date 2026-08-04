import "server-only";
import { NextResponse } from "next/server";
import { mapErrorToHttp } from "./error-mapper";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";
import { config } from "@/server/infrastructure/config/config";
import { RequestPayloadTooLargeException, ResponsePayloadTooLargeException } from "@/core/shared/exceptions";

function declaredLength(headers: Headers): number | null {
  const value = headers.get("content-length");
  if (value === null) return null;
  const length = Number(value);
  return Number.isSafeInteger(length) && length >= 0 ? length : null;
}

async function limitedRequest(request: Request): Promise<Request> {
  const declared = declaredLength(request.headers);
  if (declared !== null && declared > config.httpMaxRequestBodyBytes) {
    throw new RequestPayloadTooLargeException(config.httpMaxRequestBodyBytes);
  }
  if (!request.body || request.method === "GET" || request.method === "HEAD") return request;

  const reader = request.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let total = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > config.httpMaxRequestBodyBytes) {
      await reader.cancel();
      throw new RequestPayloadTooLargeException(config.httpMaxRequestBodyBytes);
    }
    const copy = new Uint8Array(chunk.value.byteLength);
    copy.set(chunk.value);
    chunks.push(copy.buffer);
  }

  const body = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    const bytes = new Uint8Array(chunk);
    body.set(bytes, offset);
    offset += bytes.byteLength;
  }

  const init: RequestInit & { duplex: "half" } = {
    method: request.method,
    headers: request.headers,
    body: body.buffer,
    credentials: request.credentials,
    cache: request.cache,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    integrity: request.integrity,
    keepalive: request.keepalive,
    signal: request.signal,
    duplex: "half",
  };
  const limited = new Request(request.url, init);
  return limited;
}

async function assertResponseSize(response: Response): Promise<void> {
  const declared = declaredLength(response.headers);
  if (declared !== null && declared > config.httpMaxResponseBodyBytes) {
    throw new ResponsePayloadTooLargeException(config.httpMaxResponseBodyBytes);
  }
  if (!response.body) return;
  const reader = response.clone().body?.getReader();
  if (!reader) return;
  let total = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) return;
      total += chunk.value.byteLength;
      if (total > config.httpMaxResponseBodyBytes) {
        void reader.cancel();
        throw new ResponsePayloadTooLargeException(config.httpMaxResponseBodyBytes);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function requestFromArgs(args: unknown[]): Request | null {
  return args.find((argument): argument is Request => argument instanceof Request) ?? null;
}

function recordRequestMetric(request: Request | null, status: number, durationMs: number, errorCode?: string): void {
  compositionRoot.metrics?.recordRequest({
    route: request ? new URL(request.url).pathname : "unknown",
    method: request?.method ?? "UNKNOWN",
    status,
    durationMs,
    errorCode,
  });
}

/**
 * Envuelve un route handler para capturar errores del core y devolverlos en
 * el envelope de error HTTP estándar con un requestId.
 */
export function withErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    const requestId = compositionRoot.idGenerator.generate();
    const startedAt = performance.now();
    const request = requestFromArgs(args);
    try {
      const limited = request ? await limitedRequest(request) : null;
      const handlerArgs = limited
        ? args.map((argument) => (argument === request ? limited : argument)) as TArgs
        : args;
      const response = await handler(...handlerArgs);
      await assertResponseSize(response);
      recordRequestMetric(request, response.status, performance.now() - startedAt);
      return response;
    } catch (error) {
      const { status, body } = mapErrorToHttp(error, requestId);
      recordRequestMetric(request, status, performance.now() - startedAt, body.error.code);
      if (status >= 500) {
        compositionRoot.logger.error({
          message: "Request failed",
          context: "http",
          errorCode: body.error.code,
          metadata: { requestId, status },
        });
      }
      return NextResponse.json(body, { status });
    }
  };
}
