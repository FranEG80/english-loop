"use client";

import { Check, MoveHorizontal, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { ActivityResponseValue, SwipeDeckActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { withVisibleGaps } from "../gap-display";

export interface SwipeDeckRendererProps {
  activity: SwipeDeckActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 72;
const EXIT_MS = 420;
/** Más allá el escalonado no se distingue. */
const MAX_STACK = 6;

/**
 * Mazo de 5 a 10 afirmaciones verdadero/falso. Se responde deslizando o con
 * los dos botones, y al terminar se envía el mazo completo en un único
 * intento: la media de aciertos y la lista de fallos se calculan en el
 * servidor, igual que en el resto de tipos.
 */
export function SwipeDeckRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
}: SwipeDeckRendererProps) {
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<Array<{ cardId: string; value: boolean }>>([]);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const answering = useRef(false);
  const pointerStart = useRef<number | null>(null);

  const cards = activity.cards;
  const card = cards[index];
  const remaining = cards.slice(index, index + MAX_STACK);
  // Cuando ya no queda carta que arrastrar, el mazo se ha terminado: repetir la
  // última sería decir que aún queda algo por responder.
  const finished = !card;

  /**
   * Cuánto asoma la carta de debajo: crece con el arrastre y llega al máximo
   * mientras la de arriba sale volando, de modo que al terminar la animación ya
   * ocupa el sitio de la que se ha ido.
   */
  const reveal = exitDirection ? 1 : Math.min(1, Math.abs(dragX) / 160);

  function answer(value: boolean) {
    if (disabled || answering.current || !card) return;
    answering.current = true;
    setExitDirection(value ? "right" : "left");

    const next = [...given, { cardId: card.id, value }];
    setTimeout(() => {
      setDragX(0);
      setDragging(false);
      setExitDirection(null);
      answering.current = false;
      setGiven(next);
      setIndex((current) => current + 1);
      if (next.length === cards.length) onSubmit({ kind: "deck", value: next });
    }, EXIT_MS);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (disabled || answering.current) return;
    pointerStart.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    setDragX(event.clientX - pointerStart.current);
  }

  function onPointerUp() {
    if (pointerStart.current === null) return;
    const travelled = dragX;
    pointerStart.current = null;
    setDragging(false);
    if (Math.abs(travelled) >= SWIPE_THRESHOLD) answer(travelled > 0);
    else setDragX(0);
  }

  const transform = exitDirection
    ? `translateX(${exitDirection === "right" ? 140 : -140}%) rotate(${exitDirection === "right" ? 16 : -16}deg)`
    : `translateX(${dragX}px) rotate(${dragX / 24}deg)`;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="w-full text-sm font-semibold text-foreground/70">
        {activity.instructions}
      </p>

      <div className="flex w-full max-w-lg items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[.16em] text-primary">
          {dictionary.activities.swipeDeckTitle}
        </p>
        <span className="rounded-control bg-surface-muted px-3 py-1 text-sm font-bold">
          {Math.min(index + 1, cards.length)} / {cards.length}
        </span>
      </div>

      {/* El espacio inferior deja sitio al mazo sin que se cuele bajo los
          botones. */}
      <div className="relative h-[19rem] w-full max-w-lg pb-10">
        {/* Las cartas pendientes llevan la MISMA cara que la de arriba: si les
            faltaran la cabecera o la barra de progreso, al subir a primer plano
            aparecerían de golpe y la carta daría un salto. Solo cambian el
            escalonado y la sombra, que se reserva a la de arriba para no apilar
            seis sombras sólidas en una escalera de barras negras. */}
        {remaining
          .slice(1)
          .reverse()
          .map((backing, offset) => {
            const depth = remaining.length - 1 - offset;
            // Solo la inmediata sube: es la que va a quedarse arriba.
            const lift = depth === 1 ? reveal : 0;
            const distance = depth - lift;
            return (
              <div
                key={backing.id}
                aria-hidden="true"
                className={cn(
                  "ink-card--deck absolute inset-0 rounded-[2rem] border-2 border-foreground/30",
                  isDragging ? "" : "transition-[transform,opacity] duration-300",
                )}
                style={{
                  transform: `translateY(${distance * 9}px) scale(${1 - distance * 0.04})`,
                  opacity: 1 - distance * 0.15,
                  zIndex: remaining.length - depth,
                }}
              >
                <DeckFace
                  statement={backing.statement}
                  dictionary={dictionary}
                  position={index + depth + 1}
                  total={cards.length}
                />
              </div>
            );
          })}

        {finished ? (
          <div
            role="status"
            className="ink-card ink-card--deck absolute inset-0 flex select-none flex-col items-center justify-center gap-3 rounded-[2rem] p-7 text-center sm:p-9"
          >
            <Check className="size-10 text-success" aria-hidden="true" />
            <p className="font-serif text-3xl leading-snug">
              {dictionary.activities.deckFinishedTitle}
            </p>
            <p className="text-sm font-semibold text-foreground/60">
              {dictionary.activities.deckFinishedHint.replace(
                "{total}",
                String(cards.length),
              )}
            </p>
          </div>
        ) : (
          <TopCard
            /*
             * La clave es la carta, no la posición. Sin ella React reutilizaba
             * el mismo nodo para la siguiente: la carta volvía al centro y solo
             * le cambiaba el texto, en vez de irse y dejar arriba a la de
             * debajo. Con clave propia, la que sale se desmonta y la nueva se
             * monta ya en su sitio, sin animación de vuelta.
             */
            key={card.id}
            statement={card.statement}
            dictionary={dictionary}
            position={index + 1}
            total={cards.length}
            transform={transform}
            zIndex={remaining.length + 1}
            dragX={dragX}
            isDragging={isDragging}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
        )}
      </div>

      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled || finished}
          onClick={() => answer(false)}
          className="flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-danger-surface text-lg font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <X className="size-5" aria-hidden="true" />
          {dictionary.activities.falseLabel}
        </button>
        <button
          type="button"
          disabled={disabled || finished}
          onClick={() => answer(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-success-surface text-lg font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Check className="size-5" aria-hidden="true" />
          {dictionary.activities.trueLabel}
        </button>
      </div>

      <p className="text-sm text-foreground/60">{dictionary.activities.swipeHint}</p>
    </div>
  );
}

/**
 * Carta activa. Es un componente aparte porque necesita saber que **acaba de
 * llegar a lo alto del mazo**: monta con el aspecto de las cartas del fondo y
 * en el fotograma siguiente asienta el borde y la sombra de tinta. Sin ese
 * paso, como la carta se monta de cero al cambiar la clave, el borde negro
 * aparecería de golpe.
 */
function TopCard({
  statement,
  dictionary,
  position,
  total,
  transform,
  zIndex,
  dragX,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  statement: string;
  dictionary: Dictionary;
  position: number;
  total: number;
  transform: string;
  zIndex: number;
  dragX: number;
  isDragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
}) {
  const [settled, setSettled] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    // Dos fotogramas: el primero pinta el estado de partida, el segundo dispara
    // la transición. Con uno solo el navegador fusiona ambos y no anima.
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => setSettled(true));
    });
    return () => cancelAnimationFrame(frame.current);
  }, []);

  return (
    <div
      role="group"
      aria-label={statement}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform,
        zIndex,
        borderColor: settled ? "var(--color-foreground)" : "color-mix(in srgb, var(--color-foreground) 30%, transparent)",
        boxShadow: settled ? "var(--shadow-ink)" : "0 0 0 transparent",
        transitionDuration: isDragging ? "0ms, 320ms, 320ms" : "420ms, 320ms, 320ms",
      }}
      className={cn(
        "ink-card--deck absolute inset-0 cursor-grab touch-pan-y select-none rounded-[2rem] border-2 active:cursor-grabbing",
        // El desplazamiento no se interpola mientras se arrastra —la carta iría
        // por detrás del dedo—, pero el borde y la sombra sí: son los que dan
        // la entrada suave al llegar a lo alto del mazo.
        "transition-[transform,border-color,box-shadow] ease-out",
      )}
    >
      <DeckFace
        statement={statement}
        dictionary={dictionary}
        position={position}
        total={total}
        dragX={dragX}
      />
    </div>
  );
}

/**
 * Cara de una carta. La comparten la de arriba y las del fondo para que subir
 * de posición no cambie nada más que el escalonado.
 */
function DeckFace({
  statement,
  dictionary,
  position,
  total,
  dragX = 0,
}: {
  statement: string;
  dictionary: Dictionary;
  position: number;
  total: number;
  dragX?: number;
}) {
  return (
    <div className="flex h-full flex-col justify-between p-7 sm:p-9">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-[.16em] text-foreground/45">
        <span>{dictionary.activities.swipeLeftHint}</span>
        <MoveHorizontal className="size-5" aria-hidden="true" />
        <span>{dictionary.activities.swipeRightHint}</span>
      </div>

      <p className="font-serif text-3xl leading-snug">{withVisibleGaps(statement)}</p>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${(position / total) * 100}%` }}
        />
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-6 top-24 -rotate-12 rounded-control border-4 border-success px-4 py-1 text-2xl font-black uppercase text-success transition-opacity",
          dragX > SWIPE_THRESHOLD / 2 ? "opacity-100" : "opacity-0",
        )}
      >
        {dictionary.activities.trueLabel}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-6 top-24 rotate-12 rounded-control border-4 border-danger px-4 py-1 text-2xl font-black uppercase text-danger transition-opacity",
          dragX < -SWIPE_THRESHOLD / 2 ? "opacity-100" : "opacity-0",
        )}
      >
        {dictionary.activities.falseLabel}
      </span>
    </div>
  );
}
