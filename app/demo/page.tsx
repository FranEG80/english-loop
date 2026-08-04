import DashboardPage from "@/app/dashboard/page";

/**
 * Espacio de demostración anónimo. Solo compone adaptadores mock de lectura;
 * las rutas de escritura siguen exigiendo una sesión real.
 */
export default function DemoPage() {
  return <DashboardPage demo />;
}
