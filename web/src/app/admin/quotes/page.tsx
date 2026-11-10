"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Quote = { id: string; text: string; author: string | null; active: boolean };

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("forge.admin.token") ?? "" : "";

  const load = () => apiFetch<{ quotes: Quote[] }>("/admin/quotes", {}, token).then(r => setQuotes(r.quotes));
  useEffect(() => { if (token) load(); }, []);

  async function create() {
    if (!text.trim()) return;
    await apiFetch("/admin/quotes", { method: "POST", body: JSON.stringify({ text, author: author || null, active: true }) }, token);
    setText(""); setAuthor(""); load();
  }

  async function remove(id: string) {
    await apiFetch(`/admin/quotes/${id}`, { method: "DELETE" }, token);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold italic">Frases motivacionais</h1>
      <div className="bg-surface rounded-2xl p-4 space-y-3 border border-white/10">
        <input className="w-full bg-black/40 rounded p-3" placeholder="Texto" value={text} onChange={e => setText(e.target.value)} />
        <input className="w-full bg-black/40 rounded p-3" placeholder="Autor (opcional)" value={author} onChange={e => setAuthor(e.target.value)} />
        <button onClick={create} className="bg-brand-500 px-4 py-2 rounded-lg font-semibold">Adicionar</button>
      </div>
      <ul className="space-y-2">
        {quotes.map(q => (
          <li key={q.id} className="bg-surface rounded-xl p-4 flex justify-between border border-white/10">
            <div>
              <p className="italic">{q.text}</p>
              {q.author && <p className="text-xs text-white/50">- {q.author}</p>}
            </div>
            <button onClick={() => remove(q.id)} className="text-red-400 text-sm">excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}