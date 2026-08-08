import type { MiniGameId } from "@/core/models";
import type { GameModule } from "./engine/types";
import { frogLeapMachine } from "./frog-leap/machine";
import { drawFrogLeap } from "./frog-leap/draw";
import { laneRunnerMachine } from "./lane-runner/machine";
import { drawLaneRunner } from "./lane-runner/draw";
import { sentenceTowerMachine } from "./sentence-tower/machine";
import { drawSentenceTower } from "./sentence-tower/draw";

/**
 * Registro de minijuegos. Añadir uno es registrar su módulo aquí; el shell
 * (`MiniGameRenderer`) no conoce ningún juego en concreto. El validador del
 * DATASET impide publicar contenido para un juego que no esté registrado.
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
  sentence_tower: {
    id: "sentence_tower",
    rounds: { min: 5, max: 10 },
    optionsPerRound: { min: 2, max: 3 },
    assets: [
      "/games/sentence-tower/block.webp",
      "/games/sentence-tower/crane.webp",
      "/games/sentence-tower/ground.webp",
    ],
    machine: sentenceTowerMachine,
    draw: drawSentenceTower,
  },
} satisfies Partial<Record<MiniGameId, GameModule>>;

export type RegisteredGameId = keyof typeof MODULES;

export function getGameModule(id: MiniGameId): GameModule | null {
  return (MODULES as Record<string, GameModule | undefined>)[id] ?? null;
}

export function isRegisteredGame(id: MiniGameId): id is RegisteredGameId {
  return id in MODULES;
}
