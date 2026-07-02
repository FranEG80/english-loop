const API_BASE_PATH = "/api/v1";

export class RestApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "RestApiError";
  }
}

/**
 * Cliente REST mínimo, preparado para `/api/v1` pero sin usar todavía: el
 * adapter factory solo lo selecciona si `NEXT_PUBLIC_DATA_SOURCE=rest`, y
 * hoy no existen Route Handlers que lo respondan.
 */
export async function restRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new RestApiError(
      `La petición a "${path}" falló con estado ${response.status}.`,
      response.status,
    );
  }
  if (response.status === 204) return undefined as TResponse;
  return (await response.json()) as TResponse;
}
