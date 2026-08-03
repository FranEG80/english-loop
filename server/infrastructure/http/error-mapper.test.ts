// @vitest-environment node
import { describe, expect, it } from "vitest";
import { ConflictException, ForbiddenException, InfrastructureException, ResourceNotFoundException, UnauthorizedException, ValidationException } from "@/core/shared/exceptions";
import { mapErrorToHttp } from "./error-mapper";

describe("mapErrorToHttp", () => {
  it.each([[new ValidationException("bad"), 422], [new UnauthorizedException("bad"), 401], [new ForbiddenException("bad"), 403], [new ResourceNotFoundException("bad"), 404], [new ConflictException("bad"), 409]])("maps core errors to status and envelope", (error, status) => {
    const result = mapErrorToHttp(error, "request-1");
    expect(result.status).toBe(status);
    expect(result.body.error.requestId).toBe("request-1");
  });

  it("never exposes infrastructure or unexpected error details", () => {
    class DatabaseFailure extends InfrastructureException { readonly code = "DATABASE_ERROR"; }
    const internal = mapErrorToHttp(new DatabaseFailure("password=secret"), "r1");
    const unexpected = mapErrorToHttp(new Error("secret"), "r2");
    expect(internal.status).toBe(500);
    expect(JSON.stringify(internal)).not.toContain("secret");
    expect(unexpected.body.error.code).toBe("INTERNAL_ERROR");
  });
});
