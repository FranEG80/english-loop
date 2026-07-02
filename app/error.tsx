"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="font-hand text-4xl font-bold text-coral">Oops, the loop broke</p>
      <h1 className="text-5xl font-medium">Algo ha salido mal</h1>
      <button
        type="button"
        onClick={reset}
        className="h-12 rounded-control border-2 border-foreground bg-primary-dark px-5 font-black text-white shadow-[3px_4px_0_var(--color-foreground)]"
      >
        Reintentar
      </button>
    </main>
  );
}
