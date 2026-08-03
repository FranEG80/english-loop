import "server-only";
import {
  DomainException,
  ApplicationException,
  InfrastructureException,
  ValidationException,
  UnauthorizedException,
  ForbiddenException,
  ResourceNotFoundException,
  ConflictException,
  IdempotencyConflictException,
} from "@/core/shared/exceptions";

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
    requestId: string;
  };
}

/**
 * Mapea una excepción del core a un envelope de error HTTP con su status.
 * Nunca expone stack traces, secretos ni detalles internos.
 */
export function mapErrorToHttp(
  error: unknown,
  requestId: string,
): { status: number; body: ErrorEnvelope } {
  if (error instanceof ValidationException) {
    return {
      status: 422,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: error.fieldErrors,
          requestId,
        },
      },
    };
  }

  if (error instanceof UnauthorizedException) {
    return {
      status: 401,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: {},
          requestId,
        },
      },
    };
  }

  if (error instanceof ForbiddenException) {
    return {
      status: 403,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: {},
          requestId,
        },
      },
    };
  }

  if (error instanceof ResourceNotFoundException) {
    return {
      status: 404,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: {},
          requestId,
        },
      },
    };
  }

  if (
    error instanceof ConflictException ||
    error instanceof IdempotencyConflictException
  ) {
    return {
      status: 409,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: {},
          requestId,
        },
      },
    };
  }

  if (error instanceof DomainException || error instanceof ApplicationException) {
    return {
      status: 400,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: {},
          requestId,
        },
      },
    };
  }

  if (error instanceof InfrastructureException) {
    return {
      status: 500,
      body: {
        error: {
          code: error.code,
          message: error.publicMessage,
          fieldErrors: {},
          requestId,
        },
      },
    };
  }

  // Error inesperado: no exponer detalles.
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        fieldErrors: {},
        requestId,
      },
    },
  };
}
