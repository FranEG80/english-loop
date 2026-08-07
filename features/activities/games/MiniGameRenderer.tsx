"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ActivityResponseValue, MiniGameActivityDto } from "@/core/models";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui/Button";
import { cn } from "@/shared/lib/cn";
import { prefersReducedMotion, resizeCanvas } from "./engine/canvas";
import { startGameLoop } from "./engine/loop";
import { toGameRounds, type GameCoreState, type GameInput } from "./engine/types";
import { getGameModule } from "./game-registry";

export interface MiniGameRendererProps {
  activity: MiniGameActivityDto;
  dictionary: Dictionary;
  onSubmit: (response: ActivityResponseValue) => void;
  disabled?: boolean;
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
}: MiniGameRendererProps) {
  const module = getGameModule(activity.game);
  const rounds = useMemo(() => toGameRounds(activity.rounds), [activity.rounds]);
  const reducedMotion = useAccessiblePreference();

  // El modo accesible sustituye el canvas por botones equivalentes: misma
  // partida, mismas rondas y mismo intento.
  const useAccessibleMode = reducedMotion || !module;

  if (useAccessibleMode) {
    return (
      <AccessibleRounds
        activity={activity}
        dictionary={dictionary}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    );
  }

  return (
    <CanvasGame
      activity={activity}
      dictionary={dictionary}
      onSubmit={onSubmit}
      disabled={disabled}
      rounds={rounds}
    />
  );
}

function useAccessiblePreference(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);
  return reduced;
}

function CanvasGame({
  activity,
  dictionary,
  onSubmit,
  disabled,
  rounds,
}: MiniGameRendererProps & { rounds: ReturnType<typeof toGameRounds> }) {
  const module = getGameModule(activity.game)!;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameCoreState>(module.machine.create(rounds));
  const submitted = useRef(false);
  const [hud, setHud] = useState({ roundIndex: 0, score: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loop = startGameLoop({
      update(stepMs) {
        if (disabled) return;
        stateRef.current = module.machine.tick(stateRef.current, stepMs, rounds);
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
        module.draw(surface.context, stateRef.current, {
          width: surface.width,
          height: surface.height,
          rounds,
          reducedMotion: false,
        });
      },
    });

    return () => loop.stop();
  }, [module, rounds, onSubmit, disabled]);

  function send(input: GameInput) {
    if (disabled) return;
    stateRef.current = module.machine.handle(stateRef.current, input, rounds);
  }

  const round = rounds[hud.roundIndex];

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

      <p className="font-serif text-xl leading-snug">{round?.prompt}</p>

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
          <p className="font-serif text-2xl leading-snug">{round.prompt}</p>
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
