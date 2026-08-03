/**
 * Fuente de aleatoriedad. Se abstrae para poder hacer selecciones
 * reproducibles en pruebas y para la selección con seed persistida.
 */
export interface RandomSourcePort {
  /** Entero aleatorio en [0, max). */
  int(max: number): number;
  /** Número aleatorio en [0, 1). */
  float(): number;
  /** Baraja una copia del array sin mutar el original. */
  shuffle<T>(items: readonly T[]): T[];
}
