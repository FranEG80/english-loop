import type { AppConfig } from "@/server/infrastructure/config/config";
import { D1BindingClient } from "./d1-operations";
import { D1HttpClient, type D1HttpClientOptions } from "./d1-http";
import type { D1DatabaseLike, D1Result } from "./d1-types";
import type { D1Operation } from "./d1-operations";

export interface D1TransportClient {
  execute(operation: D1Operation): Promise<D1Result>;
  batch(operations: D1Operation[]): Promise<D1Result[]>;
}

export interface D1BindingRuntime {
  DB: D1DatabaseLike;
}

export interface D1RuntimeOptions
  extends Pick<AppConfig, "databaseProvider" | "d1Transport" | "d1HttpUrl" | "d1HttpToken"> {
  binding?: D1BindingRuntime;
  fetch?: D1HttpClientOptions["fetch"];
  now?: D1HttpClientOptions["now"];
  nonce?: D1HttpClientOptions["nonce"];
}

/**
 * Selects the D1 transport once at process startup.
 *
 * Non-D1 providers return null, so D1 variables never affect SQLite,
 * PostgreSQL, or MariaDB deployments. D1 binding is the native path used by
 * a Cloudflare Worker; HTTP is the path used by a Node/Vercel process.
 */
export function createD1Transport(
  options: D1RuntimeOptions,
): D1TransportClient | null {
  if (options.databaseProvider !== "d1") return null;

  if (options.d1Transport === "binding") {
    if (!options.binding?.DB) {
      throw new Error(
        "D1_TRANSPORT=binding requires the Cloudflare D1 binding named DB",
      );
    }
    return new D1BindingClient(options.binding.DB);
  }

  if (!options.d1HttpUrl) {
    throw new Error("D1_HTTP_URL is required when D1_TRANSPORT is http");
  }
  if (!options.d1HttpToken) {
    throw new Error("D1_HTTP_TOKEN is required when D1_TRANSPORT is http");
  }

  return new D1HttpClient({
    url: options.d1HttpUrl,
    token: options.d1HttpToken,
    fetch: options.fetch,
    now: options.now,
    nonce: options.nonce,
  });
}
