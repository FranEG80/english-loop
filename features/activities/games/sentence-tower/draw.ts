import { PALETTE, centredText, inkRect } from "../engine/canvas";
import type { GameView } from "../engine/types";
import { SETTLE_MS, dropEase, type SentenceTowerState } from "./machine";

/**
 * Pintado de la torre de frases. Sin lógica: recibe el estado ya calculado.
 *
 * La cámara sigue a la cima de la torre. Cuando un bloque se posa, la vista
 * baja lo justo para que el nuevo piso quede a la misma altura que el anterior,
 * de modo que la torre puede crecer sin salirse del lienzo por muchas rondas
 * que tenga la partida.
 */

/** Alto de cada piso y del bloque que cuelga de la grúa. */
const FLOOR_HEIGHT = 46;
const FLOOR_GAP = 6;
/** Altura del riel de la grúa y del suelo, en proporción del lienzo. */
const RAIL_Y = 0.12;
const GROUND_Y = 0.88;

export function drawSentenceTower(
  context: CanvasRenderingContext2D,
  state: SentenceTowerState,
  view: GameView,
): void {
  const { width, height } = view;
  const round = view.rounds[state.roundIndex];

  context.clearRect(0, 0, width, height);
  drawSky(context, width, height);

  const railY = height * RAIL_Y;
  const groundY = height * GROUND_Y;
  const step = FLOOR_HEIGHT + FLOOR_GAP;

  // Mientras dura la pausa la cámara acaba de bajar un piso: 0 recién puesto,
  // 1 ya recolocada.
  const settleProgress = state.settleMs > 0 ? 1 - state.settleMs / SETTLE_MS : 1;
  const placedCount = state.placed.length;
  const cameraFloors = Math.max(0, placedCount - 1 + settleProgress - 1);
  const cameraY = cameraFloors * step;

  drawGround(context, width, height, groundY + cameraY);

  const blockWidth = Math.min(width * 0.7, 460);
  const blockX = (width - blockWidth) / 2;

  // Torre ya construida, de abajo arriba.
  state.placed.forEach((label, floor) => {
    const y = groundY + cameraY - (floor + 1) * step;
    if (y + FLOOR_HEIGHT < 0) return;
    inkRect(context, blockX, y, blockWidth, FLOOR_HEIGHT, 12, PALETTE.accent);
    centredText(context, label, width / 2, y + FLOOR_HEIGHT / 2, {
      size: 17,
      maxWidth: blockWidth - 24,
    });
  });

  drawRail(context, width, railY);

  if (!round) return;

  const craneX = 40 + state.craneAt * (width - 80);
  const towerTopY = groundY + cameraY - placedCount * step;

  if (state.droppingIndex === null) {
    // La grúa pasea con los bloques de la ronda colgando en abanico.
    drawHook(context, craneX, railY, railY + 34);
    round.options.forEach((option, index) => {
      const spread = (index - (round.options.length - 1) / 2) * (blockWidth / 2.4);
      const x = clamp(craneX + spread - blockWidth / 3, 8, width - blockWidth / 1.5 - 8);
      inkRect(context, x, railY + 34, blockWidth / 1.5, FLOOR_HEIGHT, 12, PALETTE.surface);
      centredText(context, option.label, x + blockWidth / 3, railY + 34 + FLOOR_HEIGHT / 2, {
        size: 15,
        maxWidth: blockWidth / 1.5 - 20,
      });
    });
    return;
  }

  // El bloque elegido baja hasta la cima de la torre.
  const option = round.options[state.droppingIndex];
  if (!option) return;
  const from = railY + 34;
  const to = towerTopY - FLOOR_HEIGHT;
  const y = from + (to - from) * dropEase(state.dropProgress);

  drawHook(context, width / 2, railY, y);
  inkRect(context, blockX, y, blockWidth, FLOOR_HEIGHT, 12, PALETTE.coral);
  centredText(context, option.label, width / 2, y + FLOOR_HEIGHT / 2, {
    size: 17,
    color: PALETTE.surface,
    maxWidth: blockWidth - 24,
  });
}

function drawSky(context: CanvasRenderingContext2D, width: number, height: number): void {
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, PALETTE.surface);
  sky.addColorStop(1, PALETTE.background);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);
}

function drawGround(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  y: number,
): void {
  if (y > height) return;
  context.fillStyle = PALETTE.primaryDark;
  context.fillRect(0, y, width, height - y);
  context.strokeStyle = PALETTE.foreground;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, y);
  context.lineTo(width, y);
  context.stroke();
}

function drawRail(context: CanvasRenderingContext2D, width: number, y: number): void {
  context.fillStyle = PALETTE.foreground;
  context.fillRect(0, y - 4, width, 8);
}

function drawHook(
  context: CanvasRenderingContext2D,
  x: number,
  fromY: number,
  toY: number,
): void {
  context.strokeStyle = PALETTE.foreground;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(x, fromY);
  context.lineTo(x, toY);
  context.stroke();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
