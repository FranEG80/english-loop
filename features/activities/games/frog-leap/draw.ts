import { PALETTE, centredText, inkRect } from "../engine/canvas";
import type { GameRound, GameView } from "../engine/types";
import { SETTLE_MS, jumpArc, type FrogLeapState } from "./machine";

/**
 * Pintado del salto de nenúfar. Sin lógica: recibe el estado ya calculado.
 *
 * La escena tiene **dos filas**. Abajo, el nenúfar en el que descansa la rana
 * junto al resto de opciones de la ronda anterior; arriba, las opciones de la
 * ronda en curso. La rana siempre salta hacia arriba. Al aterrizar, la fila
 * superior baja hasta la inferior mientras la siguiente entra por el borde de
 * arriba, de modo que el final de la transición es exactamente el estado
 * inicial de la ronda siguiente: sin saltos y sin volver al origen.
 *
 * En la primera ronda no hay fila inferior: la rana está en la orilla, no en
 * el agua, y la orilla baja y desaparece con la primera transición.
 */

/** Altura relativa de la fila de opciones y de la fila donde descansa la rana. */
const TOP_ROW = 0.28;
const BOTTOM_ROW = 0.74;
const PAD_RADIUS = 52;

export function drawFrogLeap(
  context: CanvasRenderingContext2D,
  state: FrogLeapState,
  view: GameView,
): void {
  const { width, height } = view;
  // Durante la pausa la cámara baja: 0 recién aterrizado, 1 ya recolocado.
  const scroll = state.settleMs > 0 ? 1 - state.settleMs / SETTLE_MS : 1;

  const currentRound = view.rounds[state.roundIndex];
  const previousRound = view.rounds[state.roundIndex - 1];

  context.clearRect(0, 0, width, height);
  drawRiver(context, width, height);

  const topY = height * TOP_ROW;
  const bottomY = height * BOTTOM_ROW;
  const rowGap = bottomY - topY;

  // La orilla solo existe mientras la rana no ha saltado nunca; después baja
  // con la cámara y sale de pantalla.
  if (state.roundIndex === 0 || (state.roundIndex === 1 && state.settleMs > 0)) {
    const shoreY = height - 46 + (state.roundIndex === 1 ? scroll * 90 : 0);
    drawShore(context, width, shoreY);
  }

  // Fila inferior: la ronda ya respondida, bajando hacia su sitio.
  if (previousRound) {
    const y = state.settleMs > 0 ? topY + rowGap * scroll : bottomY;
    drawRow(context, previousRound, width, y, state.targetLane, true);
  }

  // Fila superior: las opciones de la ronda en curso, entrando desde arriba.
  if (currentRound) {
    const y =
      state.settleMs > 0 && previousRound ? topY - rowGap * (1 - scroll) : topY;
    drawRow(context, currentRound, width, y, null, false);
  }

  drawFrog(context, state, view, { topY, bottomY, rowGap, scroll });
}

function drawRow(
  context: CanvasRenderingContext2D,
  round: GameRound,
  width: number,
  y: number,
  chosenLane: number | null,
  isSettled: boolean,
): void {
  const spacing = width / (round.options.length + 1);
  for (const [lane, option] of round.options.entries()) {
    const x = spacing * (lane + 1);
    drawLilyPad(context, x, y, lane === chosenLane, isSettled);
    centredText(context, option.label, x, y, {
      size: 15,
      maxWidth: spacing * 0.85,
      color: PALETTE.foreground,
    });
  }
}

function drawRiver(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = PALETTE.water;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(18, 70, 91, 0.16)";
  context.lineWidth = 2;
  for (let y = height * 0.12; y < height; y += 26) {
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(width * 0.3, y - 6, width * 0.7, y + 6, width, y);
    context.stroke();
  }
}

function drawShore(context: CanvasRenderingContext2D, width: number, y: number): void {
  context.fillStyle = PALETTE.accent;
  context.fillRect(0, y, width, 120);
  context.lineWidth = 2;
  context.strokeStyle = PALETTE.foreground;
  context.beginPath();
  context.moveTo(0, y);
  context.lineTo(width, y);
  context.stroke();
}

function drawLilyPad(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  isChosen: boolean,
  isSettled: boolean,
): void {
  context.beginPath();
  context.ellipse(x, y + 8, PAD_RADIUS, PAD_RADIUS * 0.36, 0, 0, Math.PI * 2);
  context.fillStyle = "rgba(11, 81, 77, 0.18)";
  context.fill();

  inkRect(
    context,
    x - PAD_RADIUS,
    y - PAD_RADIUS * 0.5,
    PAD_RADIUS * 2,
    PAD_RADIUS,
    PAD_RADIUS * 0.5,
    isChosen ? PALETTE.accent : isSettled ? "rgba(255, 253, 247, 0.85)" : PALETTE.surface,
  );
}

interface Camera {
  topY: number;
  bottomY: number;
  rowGap: number;
  scroll: number;
}

function drawFrog(
  context: CanvasRenderingContext2D,
  state: FrogLeapState,
  view: GameView,
  camera: Camera,
): void {
  const { width, height } = view;
  const currentRound = view.rounds[state.roundIndex];
  const previousRound = view.rounds[state.roundIndex - 1];

  const position = frogPosition(state, view, camera, currentRound, previousRound, width, height);

  context.beginPath();
  context.ellipse(position.x, position.y - 26, 20, 16, 0, 0, Math.PI * 2);
  context.fillStyle = PALETTE.primary;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = PALETTE.foreground;
  context.stroke();

  for (const offset of [-8, 8]) {
    context.beginPath();
    context.arc(position.x + offset, position.y - 38, 6, 0, Math.PI * 2);
    context.fillStyle = PALETTE.surface;
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(position.x + offset, position.y - 38, 2.5, 0, Math.PI * 2);
    context.fillStyle = PALETTE.foreground;
    context.fill();
  }
}

function frogPosition(
  state: FrogLeapState,
  view: GameView,
  camera: Camera,
  currentRound: GameRound | undefined,
  previousRound: GameRound | undefined,
  width: number,
  height: number,
): { x: number; y: number } {
  // Recolocándose tras aterrizar: viaja con su nenúfar hacia la fila inferior.
  if (state.settleMs > 0 && previousRound) {
    const spacing = width / (previousRound.options.length + 1);
    return {
      x: spacing * (state.restingLane + 1),
      y: camera.topY + camera.rowGap * camera.scroll,
    };
  }

  const start = restingPosition(state, previousRound, width, height, camera);

  // En el aire: arco parabólico desde donde estaba hasta el nenúfar elegido.
  if (state.targetLane !== null && currentRound) {
    const spacing = width / (currentRound.options.length + 1);
    const targetX = spacing * (state.targetLane + 1);
    const arc = jumpArc(view.reducedMotion ? 1 : state.jumpProgress);
    return {
      x: start.x + (targetX - start.x) * arc.x,
      y: start.y + (camera.topY - start.y) * arc.x - arc.y * 110,
    };
  }

  return start;
}

/** Dónde descansa la rana: en la orilla al empezar, o en su nenúfar. */
function restingPosition(
  state: FrogLeapState,
  previousRound: GameRound | undefined,
  width: number,
  height: number,
  camera: Camera,
): { x: number; y: number } {
  if (!previousRound) return { x: width / 2, y: height - 46 };
  const spacing = width / (previousRound.options.length + 1);
  return { x: spacing * (state.restingLane + 1), y: camera.bottomY };
}
