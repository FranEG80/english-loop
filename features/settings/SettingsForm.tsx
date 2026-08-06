"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { CefrLevel, Locale } from "@/core/models";
import { updateSettingsAction } from "@/features/settings/actions";

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

const copy = {
  es: {
    formLabel: "Ajustes de aprendizaje",
    saving: "Guardando…",
  },
  en: {
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
  const [pending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const baselineSnapshotRef = useRef(getValuesSnapshot(initialValues));
  const labels = copy[locale];

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    function updateDirtyState() {
      const currentForm = formRef.current;
      if (!currentForm) return;

      setIsDirty(
        getFormSnapshot(currentForm) !== baselineSnapshotRef.current,
      );
    }

    form.addEventListener("change", updateDirtyState);

    return () => {
      form.removeEventListener("change", updateDirtyState);
    };
  }, []);

  const isSaveDisabled = pending || !isDirty;
  const saveCursorClass = pending
    ? "cursor-wait"
    : isSaveDisabled
      ? "cursor-not-allowed"
      : "";

  return (
    <form
      ref={formRef}
      aria-busy={pending}
      aria-label={labels.formLabel}
      className="grid gap-5 lg:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const submittedSnapshot = getFormSnapshot(event.currentTarget);
        setIsDirty(false);

        startTransition(async () => {
          const result = await updateSettingsAction(formData);
          const currentForm = formRef.current;

          if (result.error) {
            setIsDirty(
              currentForm
                ? getFormSnapshot(currentForm) !== baselineSnapshotRef.current
                : true,
            );
            return;
          }

          if (result.success) {
            baselineSnapshotRef.current = submittedSnapshot;
            setIsDirty(
              currentForm
                ? getFormSnapshot(currentForm) !== submittedSnapshot
                : false,
            );
          }
        });
      }}
    >
      {children}

      <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm font-semibold text-foreground/55">
          {notice}
        </p>
        <div className="flex flex-col items-stretch sm:items-end">
          <button
            type="submit"
            disabled={isSaveDisabled}
            className={`inline-flex h-14 min-w-44 items-center justify-center gap-2 rounded-control border-2 border-foreground bg-primary-dark px-7 font-black text-white shadow-[4px_5px_0_var(--color-foreground)] transition-transform hover:-translate-y-1 disabled:translate-y-0 disabled:opacity-70 ${saveCursorClass}`}
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
