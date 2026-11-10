"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { setErr("Credenciais invÃ¡lidas"); return; }
    const data = await res.json();
    if (data.user.role !== "admin") { setErr("Sem acesso admin"); return; }
    localStorage.setItem("forge.admin.token", data.accessToken);
    r.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink text-white p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 bg-surface p-8 rounded-2xl border border-white/10">
        <h1 className="text-2xl font-bold italic">Forge Admin</h1>
        <input className="w-full bg-black/40 rounded-lg p-3" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full bg-black/40 rounded-lg p-3" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button className="w-full bg-brand-500 hover:bg-brand-600 rounded-lg p-3 font-semibold" type="submit">Entrar</button>
      </form>
    </main>
  );
}