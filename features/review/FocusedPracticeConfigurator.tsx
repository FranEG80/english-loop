"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Layers3, Sparkles } from "lucide-react";
import type {
  Locale,
  CefrLevelFilter,
  PracticeScopeAvailabilityDto,
  TaxonomyNodeDto,
  TaxonomyNodeType,
} from "@/core/models";
import { ALLOWED_SESSION_SIZES } from "@/core/models/session-size";
import type { Dictionary } from "@/shared/i18n";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

type FocusCopy = Pick<Dictionary, "common" | "catalog" | "review">;

interface FocusedPracticeConfiguratorProps {
  action: (
    previousState: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }>;
  copy: FocusCopy;
  initialNodeId?: string;
  loadAvailability: (
    taxonomyNodeId: string,
  ) => Promise<PracticeScopeAvailabilityDto[]>;
  locale: Locale;
  taxonomy: TaxonomyNodeDto[];
}

const SCOPE_LABEL_KEYS: Record<
  TaxonomyNodeType,
  "categoryLabel" | "topicLabel" | "subtopicLabel" | "skillLabel"
> = {
  category: "categoryLabel",
  topic: "topicLabel",
  subtopic: "subtopicLabel",
  skill: "skillLabel",
};

function findNodePath(
  nodes: TaxonomyNodeDto[],
  nodeId?: string,
): TaxonomyNodeDto[] | null {
  if (!nodeId) return null;

  for (const node of nodes) {
    if (node.id === nodeId) return [node];
    const childPath = findNodePath(node.children, nodeId);
    if (childPath) return [node, ...childPath];
  }

  return null;
}

function selectClassName() {
  return "h-12 w-full rounded-control border-2 border-foreground/45 bg-surface px-3 font-semibold text-foreground transition-colors hover:border-primary focus:border-primary";
}

function supportsLevel(
  node: TaxonomyNodeDto | undefined,
  level: CefrLevelFilter,
): boolean {
  return (
    node !== undefined &&
    (level === "both" || node.levels.includes(level))
  );
}

function trimPathToLevel(
  currentPath: TaxonomyNodeDto[],
  taxonomy: TaxonomyNodeDto[],
  level: CefrLevelFilter,
): TaxonomyNodeDto[] {
  if (level === "both") return currentPath;

  const currentRoot = currentPath[0];
  const root = supportsLevel(currentRoot, level)
    ? currentRoot
    : taxonomy.find((node) => supportsLevel(node, level));
  if (!root) return [];
  if (root.id !== currentRoot?.id) return [root];

  const compatiblePath = [root];
  for (const node of currentPath.slice(1)) {
    if (!supportsLevel(node, level)) break;
    compatiblePath.push(node);
  }
  return compatiblePath;
}

export function FocusedPracticeConfigurator({
  action,
  copy,
  initialNodeId,
  loadAvailability,
  locale,
  taxonomy,
}: FocusedPracticeConfiguratorProps) {
  const initialPath = useMemo(
    () => findNodePath(taxonomy, initialNodeId) ?? taxonomy.slice(0, 1),
    [initialNodeId, taxonomy],
  );
  const [path, setPath] = useState(initialPath);
  const [selectedLevel, setSelectedLevel] =
    useState<CefrLevelFilter>("both");
  const [sessionSize, setSessionSize] = useState(5);
  const [availabilityResult, setAvailabilityResult] = useState<{
    error: boolean;
    items: PracticeScopeAvailabilityDto[];
    nodeId: string;
  } | null>(null);
  const [actionState, formAction, actionPending] = useActionState(action, {});
  const selectedNode = path.at(-1);

  useEffect(() => {
    if (!selectedNode) return;
    let active = true;
    void loadAvailability(selectedNode.id)
      .then((result) => {
        if (active) {
          setAvailabilityResult({
            error: false,
            items: result,
            nodeId: selectedNode.id,
          });
        }
      })
      .catch(() => {
        if (active) {
          setAvailabilityResult({
            error: true,
            items: [],
            nodeId: selectedNode.id,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [loadAvailability, selectedNode]);

  if (!selectedNode) return null;

  const effectiveLevel = selectedLevel;
  const currentAvailability =
    availabilityResult?.nodeId === selectedNode.id
      ? availabilityResult
      : null;
  const selectedAvailability = currentAvailability?.items.find(
    (item) => item.level === effectiveLevel,
  );
  const availabilityError = currentAvailability?.error === true;
  const availableActivityCount =
    selectedAvailability?.availableActivityCount ?? 0;
  const canStart =
    !availabilityError &&
    selectedAvailability !== undefined &&
    availableActivityCount >= sessionSize;

  const chooseCategory = (node: TaxonomyNodeDto) => setPath([node]);

  const chooseLevel = (level: CefrLevelFilter) => {
    setSelectedLevel(level);
    setPath((current) => trimPathToLevel(current, taxonomy, level));
  };

  const chooseChild = (depth: number, childId: string) => {
    if (!childId) {
      setPath((current) => current.slice(0, depth));
      return;
    }

    setPath((current) => {
      const parent = current[depth - 1];
      const child = parent?.children.find(
        (node) =>
          node.id === childId && supportsLevel(node, selectedLevel),
      );
      return child ? [...current.slice(0, depth), child] : current;
    });
  };

  const drillDownLevels: Array<{
    depth: number;
    parent: TaxonomyNodeDto;
    selected?: TaxonomyNodeDto;
    visibleChildren: TaxonomyNodeDto[];
  }> = [];
  let parent = path[0];
  let depth = 1;

  while (parent) {
    const visibleChildren = parent.children.filter((node) =>
      supportsLevel(node, selectedLevel),
    );
    if (visibleChildren.length === 0) break;
    const selectedCandidate = path[depth];
    const selected = visibleChildren.find(
      (node) => node.id === selectedCandidate?.id,
    );
    drillDownLevels.push({ depth, parent, selected, visibleChildren });
    if (!selected) break;
    parent = selected;
    depth += 1;
  }

  return (
    <Card className="overflow-hidden p-0">
      <form action={formAction}>
        <input
          type="hidden"
          name="taxonomyNodeId"
          value={selectedNode.id}
        />

        <div className="border-b-2 border-foreground/15 bg-accent/20 px-5 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground bg-accent shadow-[2px_3px_0_var(--color-foreground)]">
              <Layers3 aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold">{copy.review.scopeTitle}</h2>
              <p className="mt-1 max-w-2xl text-sm font-medium text-foreground/70">
                {copy.review.scopeDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <fieldset>
              <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-primary-dark">
                <span className="mr-2 text-coral">01</span>
                {copy.review.categoryLabel}
              </legend>
              <div className="flex flex-wrap gap-2">
                {taxonomy
                  .filter((node) => supportsLevel(node, selectedLevel))
                  .map((node) => {
                    const isSelected = path[0]?.id === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => chooseCategory(node)}
                        className={`min-h-11 rounded-full border-2 px-4 py-2 text-left text-sm font-black transition-[transform,background-color,color,box-shadow] hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-foreground bg-primary-dark text-white shadow-[2px_3px_0_var(--color-foreground)]"
                            : "border-foreground/35 bg-surface text-foreground hover:border-primary"
                        }`}
                      >
                        {isSelected ? (
                          <Check
                            aria-hidden="true"
                            className="mr-1.5 inline size-4"
                          />
                        ) : null}
                        {node.label[locale]}
                      </button>
                    );
                  })}
              </div>
            </fieldset>

            {drillDownLevels.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {drillDownLevels.map(
                  ({
                    depth: levelDepth,
                    parent: levelParent,
                    selected,
                    visibleChildren,
                  }) => {
                    const childType = visibleChildren[0]?.type ?? "skill";
                    const label = copy.review[SCOPE_LABEL_KEYS[childType]];
                    return (
                      <label
                        key={`${levelParent.id}-${levelDepth}`}
                        className="flex min-w-0 flex-col gap-1.5 text-sm font-bold"
                      >
                        <span>
                          <span className="mr-2 text-coral">
                            {String(levelDepth + 1).padStart(2, "0")}
                          </span>
                          {label}
                        </span>
                        <select
                          aria-label={label}
                          value={selected?.id ?? ""}
                          onChange={(event) =>
                            chooseChild(levelDepth, event.target.value)
                          }
                          className={selectClassName()}
                        >
                          <option value="">
                            {copy.review.wholeScope.replace(
                              "{label}",
                              levelParent.label[locale],
                            )}
                          </option>
                          {visibleChildren.map((node) => (
                            <option key={node.id} value={node.id}>
                              {node.label[locale]}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  },
                )}
              </div>
            ) : null}

            <fieldset>
              <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-primary-dark">
                <span className="mr-2 text-coral">
                  {String(drillDownLevels.length + 2).padStart(2, "0")}
                </span>
                {copy.catalog.levelLabel}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(["both", "B1", "B2"] as const).map((level) => {
                  const unavailable =
                    level !== "both" &&
                    !taxonomy.some((node) => supportsLevel(node, level));
                  return (
                    <label
                      key={level}
                      className="relative cursor-pointer has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40"
                    >
                      <input
                        type="radio"
                        name="level"
                        value={level}
                        checked={effectiveLevel === level}
                        onChange={() => chooseLevel(level)}
                        disabled={unavailable}
                        className="peer sr-only"
                      />
                      <span className="inline-flex min-h-11 items-center rounded-full border-2 border-foreground/35 bg-surface px-4 font-black transition-colors peer-checked:border-foreground peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-coral">
                        {level === "both" ? copy.catalog.allLevels : level}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-primary-dark">
                <span className="mr-2 text-coral">
                  {String(drillDownLevels.length + 3).padStart(2, "0")}
                </span>
                {copy.review.sessionLength}
              </legend>
              <div className="flex flex-wrap gap-2">
                {ALLOWED_SESSION_SIZES.map((size) => (
                  <label key={size} className="cursor-pointer">
                    <input
                      type="radio"
                      name="sessionSize"
                      value={size}
                      checked={sessionSize === size}
                      onChange={() => setSessionSize(size)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-11 items-center rounded-control border-2 border-foreground/35 bg-surface px-4 font-black transition-colors peer-checked:border-foreground peer-checked:bg-level-b1 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-coral">
                      {copy.review.activitiesCount.replace("{count}", String(size))}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <aside
            aria-live="polite"
            aria-label={copy.review.selectedScope}
            className="relative flex min-h-64 flex-col overflow-hidden rounded-[1.5rem] border-2 border-foreground bg-primary-dark p-5 text-white shadow-[4px_5px_0_var(--color-foreground)]"
          >
            <Sparkles
              aria-hidden="true"
              className="absolute -right-4 -top-4 size-24 rotate-12 text-accent/20"
            />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">
              {copy.review.selectedScope}
            </p>
            <p className="mt-3 text-3xl font-semibold leading-tight">
              {selectedNode.label[locale]}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-1 text-xs font-bold text-white/70">
              {path.map((node, index) => (
                <span key={node.id} className="contents">
                  {index > 0 ? (
                    <ChevronRight aria-hidden="true" className="size-3" />
                  ) : null}
                  <span>{node.label[locale]}</span>
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold text-white/70">
              {copy.review.availableIn}: {selectedNode.levels.join(" · ")}
            </p>
            <div
              role="status"
              className="mt-4 rounded-control border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white/85"
            >
              {availabilityError
                ? copy.review.availabilityError
                : selectedAvailability
                  ? copy.review.availableActivities.replace(
                      "{count}",
                      String(availableActivityCount),
                    )
                  : copy.review.checkingAvailability}
            </div>
            {selectedAvailability && !canStart ? (
              <p className="mt-2 text-sm font-bold text-accent" role="alert">
                {copy.review.notEnoughActivities
                  .replace("{available}", String(availableActivityCount))
                  .replace("{requested}", String(sessionSize))}
              </p>
            ) : null}
            {actionState.error ? (
              <p
                className="mt-3 rounded-control border border-coral/50 bg-coral/15 px-3 py-2 text-sm font-bold text-white"
                role="alert"
              >
                {actionState.error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={!canStart || actionPending}
              className="mt-auto w-full bg-accent text-foreground hover:bg-accent/90"
            >
              {actionPending ? copy.common.loading : copy.common.start}
              <ChevronRight aria-hidden="true" className="size-5" />
            </Button>
          </aside>
        </div>
      </form>
    </Card>
  );
}
