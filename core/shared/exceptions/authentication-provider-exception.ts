import { InfrastructureException } from "./infrastructure-exception";

/** Fallo del proveedor de autenticación externo. */
export class AuthenticationProviderException extends InfrastructureException {
  readonly code = "AUTH_PROVIDER_ERROR";
}
