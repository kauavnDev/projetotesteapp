const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787/api/v1";

export async function apiFetch<T>(path: string, init: RequestInit = {}, token?: string) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}