import { describe, expect, it, vi } from "vitest";
import { D1BindingVerificationStore, D1HttpVerificationStore } from "./d1-better-auth-verification";
import { D1BindingReplayGuard } from "./d1-replay-guard";

describe("D1 authentication and replay boundaries", () => {
  it("delegates one-time verification consumption to the binding client", async () => {
    const client = { consumeVerification: vi.fn().mockResolvedValue(true) };
    const store = new D1BindingVerificationStore(client as never);
    await expect(store.consume("user@example.com", "token", "2026-01-01T00:00:00.000Z")).resolves.toBe(true);
    expect(client.consumeVerification).toHaveBeenCalledWith("user@example.com", "token", "2026-01-01T00:00:00.000Z");
  });

  it("maps HTTP verification changes to a boolean", async () => {
    const client = { execute: vi.fn()
      .mockResolvedValueOnce({ success: true, meta: { changes: 1 } })
      .mockResolvedValueOnce({ success: true, meta: { changes: 0 } }) };
    const store = new D1HttpVerificationStore(client as never);
    await expect(store.consume("identifier", "value", "now")).resolves.toBe(true);
    await expect(store.consume("identifier", "value", "now")).resolves.toBe(false);
    expect(client.execute).toHaveBeenCalledWith({ name: "consumeVerification", identifier: "identifier", value: "value", nowIso: "now" });
  });

  it("uses the current time and expiry to atomically accept a binding nonce", async () => {
    const client = { acceptReplayNonce: vi.fn().mockResolvedValue(true) };
    const guard = new D1BindingReplayGuard(client as never, () => Date.parse("2026-01-01T00:00:00.000Z"));
    await expect(guard.accept("nonce-1", Date.parse("2026-01-01T00:01:00.000Z"))).resolves.toBe(true);
    expect(client.acceptReplayNonce).toHaveBeenCalledWith(
      "nonce-1",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:01:00.000Z",
    );
  });
});
