const SERIALIZATION_CONFLICT_CODE = "P2034";

/** Prisma marks serialization failures and deadlocks with P2034. */
export function isRetryablePrismaTransactionError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error
    && (error as { code?: unknown }).code === SERIALIZATION_CONFLICT_CODE;
}
