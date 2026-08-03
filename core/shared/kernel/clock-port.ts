/**
 * Abstracción del reloj para que el dominio no dependa de `Date.now()` y
 * pueda ser controlado en pruebas.
 */
export interface ClockPort {
  now(): Date;
  /** Timestamp ISO 8601 en UTC. */
  nowIso(): string;
}
