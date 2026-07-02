export function generateId(prefix?: string): string {
  const cryptoRef = globalThis.crypto;
  const id =
    cryptoRef && "randomUUID" in cryptoRef
      ? cryptoRef.randomUUID()
      : Math.random().toString(36).slice(2);
  return prefix ? `${prefix}-${id}` : id;
}
