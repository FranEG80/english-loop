import { PALETTE, centredText, inkRect } from "../engine/canvas";
import type { GameView } from "../engine/types";
import { clampLane, gateDurationMs, type LaneRunnerState } from "./machine";

/**
 * Pintado de la carrera de carriles. Sin lógica: la posición de la puerta se
 * deriva del tiempo restante que ya calculó la máquina de estados.
 */
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

  const total = gateDurationMs(state.roundIndex);
  // La puerta entra por la derecha y llega al corredor cuando se agota.
  const progress = view.reducedMotion ? 0.5 : 1 - state.remainingMs / total;
  const gateX = width - (width - 140) * progress;

  for (let lane = 0; lane < laneCount; lane += 1) {
    const centreY = laneHeight * lane + laneHeight / 2;
    const label = round?.options[lane]?.label ?? "";
    inkRect(context, gateX - 70, centreY - laneHeight * 0.34, 140, laneHeight * 0.68, 14,
      lane === clampLane(state.lane, laneCount) ? PALETTE.accent : PALETTE.surface);
    centredText(context, label, gateX, centreY, { size: 15, maxWidth: 126 });
  }

  drawRunner(context, 90, laneHeight * clampLane(state.lane, laneCount) + laneHeight / 2);
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
    context.fillStyle = lane % 2 === 0 ? "rgba(22, 125, 115, 0.07)" : "transparent";
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
