import { PALETTE, centredText, inkRect } from "../engine/canvas";
import type { GameRound, GameView } from "../engine/types";
import {
  clampLane,
  exitProgress,
  gateProgress,
  type LaneRunnerState,
} from "./machine";

/**
 * Pintado de la carrera. Sin lógica: las posiciones se derivan del tiempo que
 * ya lleva la máquina de estados, así que el dibujo nunca se desincroniza.
 *
 * Se pintan dos juegos de puertas a la vez: el respondido saliendo por la
 * izquierda y el nuevo entrando por la derecha. Es lo que evita el corte seco
 * entre ronda y ronda.
 */

const RUNNER_X = 110;
const GATE_WIDTH = 150;

export function drawLaneRunner(
  context: CanvasRenderingContext2D,
  state: LaneRunnerState,
  view: GameView,
): void {
  const { width, height } = view;
  const round = view.rounds[state.roundIndex];
  const laneCount = round?.options.length ?? 3;
  const laneHeight = height / laneCount;

  context.clearRect(0, 0, width, height);
  drawTrack(context, width, height, laneCount, laneHeight);

  // Puerta ya respondida: sigue su camino hacia la izquierda hasta salir.
  const exiting =
    state.exitingRoundIndex === null ? undefined : view.rounds[state.exitingRoundIndex];
  if (exiting) {
    const x = RUNNER_X - (RUNNER_X + GATE_WIDTH) * exitProgress(state);
    drawGate(context, exiting, x, laneHeight, state.exitingLane, 0.65);
  }

  if (round) {
    const progress = view.reducedMotion ? 0.5 : gateProgress(state);
    const x = width - (width - RUNNER_X) * progress;
    drawGate(context, round, x, laneHeight, clampLane(state.lane, laneCount), 1);
  }

  drawRunner(context, RUNNER_X, laneHeight * clampLane(state.lane, laneCount) + laneHeight / 2);
}

function drawGate(
  context: CanvasRenderingContext2D,
  round: GameRound,
  x: number,
  laneHeight: number,
  activeLane: number | null,
  alpha: number,
): void {
  context.save();
  context.globalAlpha = alpha;
  for (const [lane, option] of round.options.entries()) {
    const centreY = laneHeight * lane + laneHeight / 2;
    inkRect(
      context,
      x - GATE_WIDTH / 2,
      centreY - laneHeight * 0.34,
      GATE_WIDTH,
      laneHeight * 0.68,
      14,
      lane === activeLane ? PALETTE.accent : PALETTE.surface,
    );
    centredText(context, option.label, x, centreY, { size: 15, maxWidth: GATE_WIDTH - 20 });
  }
  context.restore();
}

function drawTrack(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  laneCount: number,
  laneHeight: number,
): void {
  context.fillStyle = PALETTE.background;
  context.fillRect(0, 0, width, height);

  for (let lane = 0; lane < laneCount; lane += 1) {
    if (lane % 2 !== 0) continue;
    context.fillStyle = "rgba(22, 125, 115, 0.07)";
    context.fillRect(0, laneHeight * lane, width, laneHeight);
  }

  context.strokeStyle = "rgba(18, 42, 47, 0.25)";
  context.setLineDash([14, 12]);
  context.lineWidth = 2;
  for (let lane = 1; lane < laneCount; lane += 1) {
    context.beginPath();
    context.moveTo(0, laneHeight * lane);
    context.lineTo(width, laneHeight * lane);
    context.stroke();
  }
  context.setLineDash([]);
}

function drawRunner(context: CanvasRenderingContext2D, x: number, y: number): void {
  context.beginPath();
  context.arc(x, y - 18, 11, 0, Math.PI * 2);
  context.fillStyle = PALETTE.primary;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = PALETTE.foreground;
  context.stroke();

  context.beginPath();
  context.roundRect(x - 10, y - 6, 20, 30, 8);
  context.fillStyle = PALETTE.coral;
  context.fill();
  context.stroke();
}
