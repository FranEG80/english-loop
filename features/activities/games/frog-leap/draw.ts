import { PALETTE, centredText, inkRect } from "../engine/canvas";
import type { GameView } from "../engine/types";
import { jumpArc, type FrogLeapState } from "./machine";

/**
 * Pintado del salto de nenúfar. Sin lógica: recibe el estado ya calculado.
 *
 * No hay sprites todavía, así que la escena se dibuja con formas primitivas
 * usando la paleta de la marca. Cuando existan los `.webp` bastará con
 * sustituir las funciones de dibujo, sin tocar la máquina de estados.
 */
export function drawFrogLeap(
  context: CanvasRenderingContext2D,
  state: FrogLeapState,
  view: GameView,
): void {
  const { width, height } = view;
  const round = view.rounds[state.roundIndex];

  context.clearRect(0, 0, width, height);
  drawRiver(context, width, height);

  const lanes = round?.options.length ?? 3;
  const padSpacing = width / (lanes + 1);
  const padY = height * 0.42;

  for (let lane = 0; lane < lanes; lane += 1) {
    const x = padSpacing * (lane + 1);
    drawLilyPad(context, x, padY, lane === state.targetLane);
    const label = round?.options[lane]?.label ?? "";
    centredText(context, label, x, padY, {
      size: 15,
      maxWidth: padSpacing * 0.85,
      color: PALETTE.foreground,
    });
  }

  drawFrog(context, state, width, height, padSpacing, padY, view.reducedMotion);
}

function drawRiver(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = PALETTE.water;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(18, 70, 91, 0.16)";
  context.lineWidth = 2;
  for (let y = height * 0.2; y < height; y += 26) {
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(width * 0.3, y - 6, width * 0.7, y + 6, width, y);
    context.stroke();
  }

  // Orilla de salida.
  context.fillStyle = PALETTE.accent;
  context.fillRect(0, height - 46, width, 46);
  context.strokeStyle = PALETTE.foreground;
  context.beginPath();
  context.moveTo(0, height - 46);
  context.lineTo(width, height - 46);
  context.stroke();
}

function drawLilyPad(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  isTarget: boolean,
): void {
  const radius = 52;
  context.beginPath();
  context.ellipse(x, y + 8, radius, radius * 0.36, 0, 0, Math.PI * 2);
  context.fillStyle = "rgba(11, 81, 77, 0.18)";
  context.fill();

  inkRect(context, x - radius, y - radius * 0.5, radius * 2, radius, radius * 0.5,
    isTarget ? PALETTE.accent : PALETTE.surface);
}

function drawFrog(
  context: CanvasRenderingContext2D,
  state: FrogLeapState,
  width: number,
  height: number,
  padSpacing: number,
  padY: number,
  reducedMotion: boolean,
): void {
  const startX = padSpacing * (state.restingLane + 1);
  const startY = height - 70;
  const targetX = state.targetLane === null ? startX : padSpacing * (state.targetLane + 1);

  // Con movimiento reducido la rana aparece directamente en el destino.
  const progress = reducedMotion ? 1 : state.jumpProgress;
  const arc = jumpArc(progress);
  const x = startX + (targetX - startX) * arc.x;
  const y = startY + (padY - startY) * arc.x - arc.y * 90;

  context.beginPath();
  context.ellipse(x, y, 20, 16, 0, 0, Math.PI * 2);
  context.fillStyle = PALETTE.primary;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = PALETTE.foreground;
  context.stroke();

  for (const offset of [-8, 8]) {
    context.beginPath();
    context.arc(x + offset, y - 12, 6, 0, Math.PI * 2);
    context.fillStyle = PALETTE.surface;
    context.fill();
    context.stroke();
    context.beginPath();
    context.arc(x + offset, y - 12, 2.5, 0, Math.PI * 2);
    context.fillStyle = PALETTE.foreground;
    context.fill();
  }
}
