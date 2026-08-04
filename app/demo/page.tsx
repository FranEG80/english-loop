import DashboardPage from "@/app/dashboard/page";

/**
 * Espacio de demostración anónimo. Lee el fixture demo sembrado en la base de
 * datos y no crea una sesión Better Auth ni permite escrituras.
 */
export default function DemoPage() {
  return <DashboardPage demo />;
}
