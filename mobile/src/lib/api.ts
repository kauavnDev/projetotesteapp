import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const BASE = (Constants.expoConfig?.extra?.apiUrl as string) ?? "http://localhost:8787/api/v1";
const ACCESS_KEY = "forge.access";
const REFRESH_KEY = "forge.refresh";

export const tokens = {
  get: async () => ({
    access: await SecureStore.getItemAsync(ACCESS_KEY),
    refresh: await SecureStore.getItemAsync(REFRESH_KEY),
  }),
  set: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

async function request(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const { access } = await tokens.get();
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (access) headers.set("authorization", `Bearer ${access}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (res.status === 401 && retry) {
    const { refresh } = await tokens.get();
    if (refresh) {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (r.ok) {
        const { accessToken } = await r.json();
        await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
        return request(path, init, false);
      }
    }
  }
  return res;
}

export const api = {
  get: <T,>(p: string) => request(p).then(r => r.json() as Promise<T>),
  post: <T,>(p: string, body?: unknown) => request(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }).then(r => r.json() as Promise<T>),
  patch: <T,>(p: string, body?: unknown) => request(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }).then(r => r.json() as Promise<T>),
  del: <T,>(p: string) => request(p, { method: "DELETE" }).then(r => r.json() as Promise<T>),
};