/** Colores tomados de `app/globals.css` para que los juegos no desentonen. */
export const PALETTE = {
  background: "#f7f3e8",
  foreground: "#122a2f",
  primary: "#167d73",
  primaryDark: "#0b514d",
  accent: "#f6bc45",
  coral: "#ed6a4c",
  surface: "#fffdf7",
  water: "#ccebf1",
  waterDeep: "#12465b",
  success: "#287249",
  danger: "#a9362f",
} as const;

export interface CanvasSurface {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Ajusta el lienzo a su tamaño en pantalla teniendo en cuenta la densidad de
 * píxeles. Sin esto el dibujo se ve borroso en pantallas retina.
 */
export function resizeCanvas(canvas: HTMLCanvasElement): CanvasSurface | null {
  const context = canvas.getContext("2d");
  if (!context) return null;

  const ratio = Math.min(3, globalThis.devicePixelRatio || 1);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  return { context, width, height };
}

export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Rectángulo redondeado con el borde de tinta de la marca. */
export function inkRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = 2;
  context.strokeStyle = PALETTE.foreground;
  context.stroke();
}

export function centredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { size?: number; color?: string; weight?: string; maxWidth?: number } = {},
): void {
  const { size = 16, color = PALETTE.foreground, weight = "700", maxWidth } = options;
  context.font = `${weight} ${size}px "Avenir Next", "Gill Sans", sans-serif`;
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, x, y, maxWidth);
}
