import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/infrastructure/auth/auth";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";

const handlers = toNextJsHandler(auth);

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function handleAuthRequest(
  request: Request,
  handler: (request: Request) => Promise<Response>,
): Promise<Response> {
  if (await compositionRoot.authRateLimiter.isLimited(`auth:${clientKey(request)}`)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests." } },
      { status: 429 },
    );
  }
  return handler(request);
}

export const GET = (request: Request) =>
  handleAuthRequest(request, handlers.GET);
export const POST = (request: Request) =>
  handleAuthRequest(request, handlers.POST);
