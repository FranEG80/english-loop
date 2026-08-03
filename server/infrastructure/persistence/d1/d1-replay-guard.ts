import type { ReplayGuard } from "./d1-http";
import type { D1BindingClient } from "./d1-operations";

/** Persistent, single-use nonce guard for the Worker HTTP proxy. */
export class D1BindingReplayGuard implements ReplayGuard {
  constructor(private readonly client: D1BindingClient, private readonly now: () => number = Date.now) {}

  accept(nonce: string, expiresAt: number): Promise<boolean> {
    const now = this.now();
    return this.client.acceptReplayNonce(
      nonce,
      new Date(now).toISOString(),
      new Date(expiresAt).toISOString(),
    );
  }
}
