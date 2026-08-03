import "server-only";
import { NextResponse } from "next/server";
import { mapErrorToHttp } from "./error-mapper";
import { compositionRoot } from "@/server/infrastructure/composition/composition-root";

/**
 * Envuelve un route handler para capturar errores del core y devolverlos en
 * el envelope de error HTTP estándar con un requestId.
 */
export function withErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>,
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    const requestId = compositionRoot.idGenerator.generate();
    try {
      return await handler(...args);
    } catch (error) {
      const { status, body } = mapErrorToHttp(error, requestId);
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
