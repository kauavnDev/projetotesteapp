import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-ink text-white gap-4">
      <h1 className="text-4xl font-bold italic">Forge o seu amanhÃ£</h1>
      <p className="text-white/60">Painel administrativo</p>
      <Link className="bg-brand-500 px-6 py-3 rounded-lg font-semibold" href="/login">Entrar</Link>
    </main>
  );
}