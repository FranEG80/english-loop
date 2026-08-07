import type { MiniGameId } from "@/core/models";
import type { GameCoreState, GameModule } from "./engine/types";
import { frogLeapMachine } from "./frog-leap/machine";
import { drawFrogLeap } from "./frog-leap/draw";
import { laneRunnerMachine } from "./lane-runner/machine";
import { drawLaneRunner } from "./lane-runner/draw";

/**
 * Registro de minijuegos. Añadir uno es registrar su módulo aquí; el shell
 * (`MiniGameRenderer`) no conoce ningún juego en concreto.
 *
 * `sentence_tower` está especificado en `DOC/MINIGAMES-SPEC.md` y todavía no
 * implementado: el validador del DATASET impide publicar contenido para un
 * juego que no esté registrado.
 */
const MODULES = {
  frog_leap: {
    id: "frog_leap",
    rounds: { min: 5, max: 10 },
    optionsPerRound: { min: 2, max: 3 },
    assets: [
      "/games/frog-leap/frog-idle.webp",
      "/games/frog-leap/frog-jump.webp",
      "/games/frog-leap/lilypad.webp",
    ],
    machine: frogLeapMachine,
    draw: drawFrogLeap,
  },
  lane_runner: {
    id: "lane_runner",
    rounds: { min: 5, max: 10 },
    optionsPerRound: { min: 3, max: 3 },
    assets: [
      "/games/lane-runner/runner-sheet.webp",
      "/games/lane-runner/gate.webp",
      "/games/lane-runner/bg-far.webp",
    ],
    machine: laneRunnerMachine,
    draw: drawLaneRunner,
  },
} as const satisfies Partial<Record<MiniGameId, GameModule<never>>>;

export type RegisteredGameId = keyof typeof MODULES;

export function getGameModule(id: MiniGameId): GameModule<GameCoreState> | null {
  return (MODULES as Record<string, GameModule<GameCoreState> | undefined>)[id] ?? null;
}

export function isRegisteredGame(id: MiniGameId): id is RegisteredGameId {
  return id in MODULES;
}
