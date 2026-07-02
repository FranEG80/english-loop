import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-hand text-4xl font-bold text-coral">Lost in the loop</p>
      <h1 className="text-7xl font-black">404</h1>
      <p>El contenido solicitado no existe.</p>
      <Link href="/" className="font-medium text-primary-dark">
        Volver al inicio
      </Link>
    </main>
  );
}
