"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("forge.admin.token")) r.push("/login");
  }, []);
  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="border-b border-white/10 px-6 py-4 flex gap-6">
        <span className="font-bold italic">Forge Admin</span>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/users">Usuarios</Link>
        <Link href="/admin/quotes">Frases</Link>
      </header>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}