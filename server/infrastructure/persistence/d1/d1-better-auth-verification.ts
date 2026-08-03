import type { D1BindingClient } from "./d1-operations";
import type { D1HttpClient } from "./d1-http";

export interface OneTimeVerificationStore {
  consume(identifier: string, value: string, nowIso: string): Promise<boolean>;
}

/** Better Auth's consume-one boundary, backed by a native D1 DELETE. */
export class D1BindingVerificationStore implements OneTimeVerificationStore {
  constructor(private readonly client: D1BindingClient) {}

  consume(identifier: string, value: string, nowIso: string): Promise<boolean> {
    return this.client.consumeVerification(identifier, value, nowIso);
  }
}

export class D1HttpVerificationStore implements OneTimeVerificationStore {
  constructor(private readonly client: D1HttpClient) {}

  async consume(identifier: string, value: string, nowIso: string): Promise<boolean> {
    const result = await this.client.execute({
      name: "consumeVerification",
      identifier,
      value,
      nowIso,
    });
    return (result.meta?.changes ?? 0) === 1;
  }
}
