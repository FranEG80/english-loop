"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Save,
  X,
} from "lucide-react";
import type { CefrLevel, Locale } from "@/core/models";
import {
  type SettingsActionState,
  updateSettingsAction,
} from "@/features/settings/actions";

interface SettingsFormProps {
  children: ReactNode;
  initialValues: SettingsFormValues;
  locale: Locale;
  notice: string;
  saveLabel: string;
}

interface SettingsFormValues {
  activeLevels: readonly CefrLevel[];
  dailyGoal: number;
  locale: Locale;
  reducedMotion: boolean;
}

interface SettingsToast {
  kind: "error" | "success";
  message: string;
}

const copy = {
  es: {
    closeToast: "Cerrar notificación",
    formLabel: "Ajustes de aprendizaje",
    saving: "Guardando…",
  },
  en: {
    closeToast: "Close notification",
    formLabel: "Learning settings",
    saving: "Saving…",
  },
} as const;

function getValuesSnapshot(values: SettingsFormValues) {
  return JSON.stringify({
    activeLevels: [...values.activeLevels].sort(),
    dailyGoal: values.dailyGoal,
    locale: values.locale,
    reducedMotion: values.reducedMotion,
  });
}

function getFormSnapshot(form: HTMLFormElement) {
  const formData = new FormData(form);

  return getValuesSnapshot({
    activeLevels: formData
      .getAll("activeLevels")
      .filter((value): value is CefrLevel => value === "B1" || value === "B2"),
    dailyGoal: Number(formData.get("dailyGoal") ?? 3),
    locale: formData.get("locale") === "en" ? "en" : "es",
    reducedMotion: formData.get("reducedMotion") === "on",
  });
}

export function SettingsForm({
  children,
  initialValues,
  locale,
  notice,
  saveLabel,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateSettingsAction,
    undefined,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [dismissedState, setDismissedState] = useState<
    SettingsActionState | undefined
  >(undefined);
  const [supersededState, setSupersededState] = useState<
    SettingsActionState | undefined
  >(undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const baselineSnapshotRef = useRef(getValuesSnapshot(initialValues));
  const submittedSnapshotRef = useRef<string | null>(null);
  const labels = copy[locale];

  useEffect(() => {
    if (state?.success && submittedSnapshotRef.current) {
      baselineSnapshotRef.current = submittedSnapshotRef.current;
    }
  }, [state]);

  const showToast = !pending && state !== dismissedState;
  const toastKind: SettingsToast["kind"] | null = showToast
    ? state?.error
      ? "error"
      : state?.success
        ? "success"
        : null
    : null;
  const toastMessage = state?.error ?? state?.success;
  const toast: SettingsToast | null =
    toastKind && toastMessage
      ? { kind: toastKind, message: toastMessage }
      : null;

  useEffect(() => {
    if (!toastKind) return;

    const timeoutId = window.setTimeout(
      () => setDismissedState(state),
      toastKind === "error" ? 6000 : 3200,
    );

    return () => window.clearTimeout(timeoutId);
  }, [state, toastKind]);

  const canRetryFailedSave = Boolean(
    state?.error && state !== supersededState,
  );

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function updateDirtyState() {
      const currentForm = formRef.current;
      if (!currentForm) return;

      submittedSnapshotRef.current = null;
      setDismissedState(state);
      setSupersededState(state);
      setIsDirty(
        getFormSnapshot(currentForm) !== baselineSnapshotRef.current,
      );
    }

    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest('button[type="button"]')) return;

      queueMicrotask(updateDirtyState);
    }

    form.addEventListener("change", updateDirtyState);
    form.addEventListener("click", handleClick);

    return () => {
      form.removeEventListener("change", updateDirtyState);
      form.removeEventListener("click", handleClick);
    };
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      aria-busy={pending}
      aria-label={labels.formLabel}
      className="grid gap-5 lg:grid-cols-2"
      onSubmit={(event) => {
        submittedSnapshotRef.current = getFormSnapshot(event.currentTarget);
        setDismissedState(state);
        setSupersededState(state);
        setIsDirty(false);
      }}
    >
      {children}

      {toast && !pending ? (
        <div
          role={toast.kind === "error" ? "alert" : "status"}
          aria-atomic="true"
          className={`fixed left-1/2 top-5 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-start gap-3 rounded-[1.25rem] border-2 px-4 py-3.5 shadow-[4px_5px_0_var(--color-foreground)] animate-[rise-in_180ms_ease-out] motion-reduce:animate-none sm:left-auto sm:right-6 sm:top-6 sm:translate-x-0 ${
            toast.kind === "error"
              ? "border-danger bg-danger-surface text-danger"
              : "border-foreground bg-accent text-foreground"
          }`}
        >
          {toast.kind === "error" ? (
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <p className="min-w-0 flex-1 text-sm font-black leading-snug">
            {toast.message}
          </p>
          <button
            type="button"
            aria-label={labels.closeToast}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors hover:bg-foreground/10"
            onClick={() => setDismissedState(state)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm font-semibold text-foreground/55">
          {notice}
        </p>
        <div className="flex flex-col items-stretch sm:items-end">
          <button
            type="submit"
            disabled={pending || (!isDirty && !canRetryFailedSave)}
            className="inline-flex h-14 min-w-44 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-primary-dark px-7 font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
          >
            {pending ? (
              <LoaderCircle
                className="h-5 w-5 animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Save className="h-5 w-5" aria-hidden="true" />
            )}
            {pending ? labels.saving : saveLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
