import { describe, expect, it } from "vitest";
import {
  AuthenticationProviderException,
  CatalogExhaustedException,
  DatasetUnavailableException,
  IdempotencyConflictException,
  InvalidActivityResponseException,
  InvalidPracticeScopeException,
  PersistenceException,
} from "./index";

describe("application, domain and infrastructure exception contracts", () => {
  it.each([
    [AuthenticationProviderException, "AUTH_PROVIDER_ERROR", "Internal server error"],
    [CatalogExhaustedException, "CATALOG_EXHAUSTED", "public catalog error"],
    [DatasetUnavailableException, "DATASET_UNAVAILABLE", "Internal server error"],
    [IdempotencyConflictException, "IDEMPOTENCY_CONFLICT", "public conflict"],
    [InvalidActivityResponseException, "INVALID_ACTIVITY_RESPONSE", "public activity error"],
    [InvalidPracticeScopeException, "INVALID_PRACTICE_SCOPE", "public scope error"],
    [PersistenceException, "PERSISTENCE_ERROR", "Internal server error"],
  ])("keeps stable error metadata for %s", (ExceptionType, code, publicMessage) => {
    const error = new ExceptionType("internal details", publicMessage, { requestId: "req-1" });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("internal details");
    expect(error.code).toBe(code);
    expect(error.publicMessage).toBe(publicMessage);
    expect(error.metadata).toEqual({ requestId: "req-1" });
  });
});
