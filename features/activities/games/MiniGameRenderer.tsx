"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  ActivityResponseValue,
  AttemptFeedbackDto,
  MiniGameActivityDto,
} from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { cn } from "@/shared/lib/cn";
import { prefersReducedMotion, resizeCanvas } from "./engine/canvas";
import { startGameLoop } from "./engine/loop";
import { toGameRounds, type GameCoreState, type GameInput } from "./engine/types";
import { getGameModule } from "./game-registry";
import { withVisibleGaps } from "../gap-display";

export interface MiniGameRendererProps {
  activity: MiniGameActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
  /** Corrección del servidor: cierra la partida con el marcador y los fallos. */
  feedback?: AttemptFeedbackDto | null;
}

/**
 * Shell común de los minijuegos: monta el canvas, lleva el bucle y el HUD, y
 * envía las respuestas de todas las rondas en un único intento.
 *
 * El juego nunca sabe qué opción es la correcta, así que durante la partida la
 * animación es neutra. La corrección y el desglose de fallos llegan del
 * servidor y se muestran en el resumen.
 */
export function MiniGameRenderer({
  activity,
  dictionary,
  onSubmit,
  disabled,
  feedback,
}: MiniGameRendererProps) {
  const gameModule = getGameModule(activity.game);
  const rounds = useMemo(() => toGameRounds(activity.rounds), [activity.rounds]);
  const reducedMotion = useReducedMotion();

  // El modo accesible sustituye el canvas por botones equivalentes: misma
  // partida, mismas rondas y mismo intento.
  const useAccessibleMode = reducedMotion || !gameModule;

  if (useAccessibleMode) {
    return (
      <AccessibleRounds
        activity={activity}
        dictionary={dictionary}
        onSubmit={onSubmit}
        disabled={disabled}
        feedback={feedback}
      />
    );
  }

  return (
    <CanvasGame
      activity={activity}
      dictionary={dictionary}
      onSubmit={onSubmit}
      disabled={disabled}
      feedback={feedback}
      rounds={rounds}
    />
  );
}

/**
 * Se suscribe a `prefers-reduced-motion` en vez de leerlo una vez: si el
 * usuario cambia la preferencia del sistema, la actividad pasa al modo
 * accesible sin recargar.
 */
function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => false);
}

function subscribeToReducedMotion(onChange: () => void): () => void {
  const query = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function CanvasGame({
  activity,
  dictionary,
  onSubmit,
  disabled,
  feedback,
  rounds,
}: MiniGameRendererProps & { rounds: ReturnType<typeof toGameRounds> }) {
  const gameModule = getGameModule(activity.game)!;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameCoreState>(gameModule.machine.create(rounds));
  const submitted = useRef(false);
  const [hud, setHud] = useState({ roundIndex: 0, score: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = startGameLoop({
      update(stepMs) {
        if (disabled) return;
        stateRef.current = gameModule.machine.tick(stateRef.current, stepMs, rounds);
        const { roundIndex, score, phase, answers } = stateRef.current;
        setHud((current) =>
          current.roundIndex === roundIndex && current.score === score
            ? current
            : { roundIndex, score },
        );
        if (phase === "finished" && !submitted.current) {
          submitted.current = true;
          onSubmit({ kind: "rounds", value: answers });
        }
      },
      draw() {
        const surface = resizeCanvas(canvas);
        if (!surface) return;
        gameModule.draw(surface.context, stateRef.current, {
          width: surface.width,
          height: surface.height,
          rounds,
          reducedMotion: false,
        });
      },
    });

    return () => loop.stop();
  }, [gameModule, rounds, onSubmit, disabled]);

  function send(input: GameInput) {
    if (disabled) return;
    stateRef.current = gameModule.machine.handle(stateRef.current, input, rounds);
  }

  const round = rounds[hud.roundIndex];

  if (feedback) {
    return <GameResults activity={activity} dictionary={dictionary} feedback={feedback} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>

      <div className="flex items-center justify-between text-sm font-bold">
        <span>
          {dictionary.activities.gameRoundLabel
            .replace("{index}", String(hud.roundIndex + 1))
            .replace("{total}", String(rounds.length))}
        </span>
        <span className="rounded-control bg-surface-muted px-3 py-1">
          {dictionary.activities.gameScoreLabel}: {hud.score}
        </span>
      </div>

      {round?.context ? (
        <blockquote className="rounded-control border-l-4 border-primary/45 bg-surface-muted/60 px-4 py-3 text-base leading-relaxed">
          {withVisibleGaps(round.context)}
        </blockquote>
      ) : null}
      <p className="font-serif text-xl leading-snug">
        {round ? withVisibleGaps(round.prompt) : null}
      </p>

      <canvas
        ref={canvasRef}
        className="h-[22rem] w-full rounded-[1.5rem] border-2 border-foreground bg-surface"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") send({ kind: "lane", lane: laneOf(-1) });
          if (event.key === "ArrowRight") send({ kind: "lane", lane: laneOf(1) });
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            send({ kind: "confirm" });
          }
        }}
        tabIndex={0}
        role="application"
        aria-label={round?.prompt ?? activity.instructions}
      />

      {/* Controles visibles: el canvas por sí solo no es operable con teclado
          ni con lector de pantalla. */}
      <ul className="grid gap-2 sm:grid-cols-3">
        {round?.options.map((option, index) => (
          <li key={option.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                send({ kind: "select", optionIndex: index });
                send({ kind: "confirm" });
              }}
              className="w-full rounded-control border-2 border-foreground bg-surface px-4 py-3 font-bold shadow-[3px_4px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  function laneOf(delta: number): number {
    return Math.max(0, (stateRef.current as { lane?: number }).lane ?? 0) + delta;
  }
}

/** Alternativa sin canvas, equivalente y navegable por teclado. */
function AccessibleRounds({
  activity,
  dictionary,
  onSubmit,
  disabled,
  feedback,
}: MiniGameRendererProps) {
  const [answers, setAnswers] = useState<Array<{ roundId: string; optionId: string }>>([]);
  const index = answers.length;
  const round = activity.rounds[index];

  function choose(optionId: string) {
    if (disabled || !round) return;
    const next = [...answers, { roundId: round.id, optionId }];
    setAnswers(next);
    if (next.length === activity.rounds.length) onSubmit({ kind: "rounds", value: next });
  }

  if (feedback) {
    return <GameResults activity={activity} dictionary={dictionary} feedback={feedback} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground/70">{activity.instructions}</p>
      <p className="text-xs font-black uppercase tracking-[.14em] text-primary">
        {dictionary.activities.gameAccessibleModeLabel}
      </p>
      <p className="text-sm font-bold">
        {dictionary.activities.gameRoundLabel
          .replace("{index}", String(Math.min(index + 1, activity.rounds.length)))
          .replace("{total}", String(activity.rounds.length))}
      </p>

      {round ? (
        <>
          <p className="font-serif text-2xl leading-snug">{withVisibleGaps(round.prompt)}</p>
          <div role="group" aria-label={round.prompt} className="grid gap-3 sm:grid-cols-2">
            {round.options.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => choose(option.id)}
                className={cn(
                  "rounded-control border-2 border-foreground bg-surface px-4 py-3 text-left font-bold",
                  "shadow-[3px_4px_0_var(--color-foreground)] transition-transform hover:-translate-y-0.5 disabled:opacity-50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Pantalla final de la partida: media de aciertos y la explicación de cada
 * ronda fallada. Es el cierre que faltaba tras la última ronda.
 */
function GameResults({
  activity,
  dictionary,
  feedback,
}: {
  activity: MiniGameActivityDto;
  dictionary: Dictionary;
  feedback: AttemptFeedbackDto;
}) {
  const hits = feedback.items.filter((item) => item.isCorrect).length;
  const wrong = feedback.items.filter((item) => !item.isCorrect);
  const promptOf = (roundId: string) =>
    activity.rounds.find((round) => round.id === roundId)?.prompt ?? roundId;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[1.5rem] border-2 border-foreground bg-surface-muted p-6 text-center">
        <p className="text-xs font-black uppercase tracking-[.16em] text-primary">
          {dictionary.activities.gameResultsTitle}
        </p>
        <p className="mt-2 font-serif text-5xl font-bold">
          {hits} / {feedback.items.length}
        </p>
        <p className="mt-1 text-sm font-bold text-foreground/60">
          {Math.round(feedback.score * 100)} %
        </p>
      </div>

      {wrong.length === 0 ? (
        <p className="text-center text-lg font-bold text-success">
          {dictionary.activities.gameAllCorrect}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {wrong.map((item) => (
            <li
              key={item.itemId}
              className="rounded-control border-2 border-danger/40 bg-danger-surface/40 p-4 text-sm"
            >
              <p className="font-bold">{withVisibleGaps(promptOf(item.itemId))}</p>
              <p className="mt-1">
                <span className="line-through opacity-70">{item.given || "—"}</span>{" "}
                <span className="font-bold text-success">{item.expected.join(", ")}</span>
              </p>
              {item.feedback ? <p className="mt-1 opacity-80">{item.feedback}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
