export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // `AggregatedMetrics` se instancia en el composition root y registra
    // latencia/errores HTTP sin depender de un proveedor externo. Este punto
    // queda reservado para exportarlo a OpenTelemetry en producción.
  }
}
