/**
 * Unidad de trabajo: ejecuta una operación dentro de una transacción.
 * El core depende de este puerto, no de Prisma.
 */
export interface UnitOfWorkPort {
  /**
   * Ejecuta `work` dentro de una transacción. Si `work` lanza, se hace
   * rollback; si no, se hace commit.
   */
  transaction<T>(work: () => Promise<T>): Promise<T>;
}
