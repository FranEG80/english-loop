/**
 * Bucle de juego con paso de tiempo fijo. El acumulador evita que la lógica
 * dependa de los fotogramas por segundo del dispositivo: la misma partida se
 * comporta igual en un móvil lento y en un portátil rápido.
 */

/** 60 fotogramas por segundo. */
export const FIXED_STEP_MS = 1000 / 60;
/** Tope de recuperación tras una pausa larga: evita la espiral de la muerte. */
const MAX_FRAME_MS = 250;

export interface GameLoopCallbacks {
  update(stepMs: number): void;
  draw(): void;
}

export interface GameLoopHandle {
  stop(): void;
}

export function startGameLoop({ update, draw }: GameLoopCallbacks): GameLoopHandle {
  let running = true;
  let previous: number | null = null;
  let accumulator = 0;
  let frame = 0;

  function step(now: number) {
    if (!running) return;

    const delta = previous === null ? 0 : Math.min(MAX_FRAME_MS, now - previous);
    previous = now;
    accumulator += delta;

    while (accumulator >= FIXED_STEP_MS) {
      update(FIXED_STEP_MS);
      accumulator -= FIXED_STEP_MS;
    }

    draw();
    frame = requestAnimationFrame(step);
  }

  frame = requestAnimationFrame(step);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
  };
}
