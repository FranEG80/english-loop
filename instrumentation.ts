export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Aquí se registrarían métricas de latencia por endpoint, errores por
    // código, intentos procesados, etc. (p. ej. OpenTelemetry).
    // Por ahora, el logger estructurado ya emite eventos con requestId.
  }
}
