export const ALLOWED_SESSION_SIZES = [5, 10, 15, 20] as const;
export type SessionSize = (typeof ALLOWED_SESSION_SIZES)[number];
