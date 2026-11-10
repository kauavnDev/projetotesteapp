"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

type U = { id: string; email: string; name: string; role: string };
export default function Users() {
  const [users, setUsers] = useState<U[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("forge.admin.token") ?? "" : "";
  useEffect(() => {
    if (token) apiFetch<{ users: U[] }>("/admin/users", {}, token).then(r => setUsers(r.users));
  }, [token]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold italic">Usuarios</h1>
      <ul className="space-y-2">
        {users.map(u => (
          <li key={u.id} className="bg-surface rounded-xl p-4 border border-white/10">
            <p className="font-semibold">{u.name} <span className="text-white/50">({u.email})</span></p>
            <p className="text-xs text-white/50">{u.role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}