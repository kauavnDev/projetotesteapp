import { create } from "zustand";
import { api, tokens } from "../lib/api";

type User = { id: string; email: string; name: string; role: "user" | "admin"; onboardingCompleted: boolean };

type State = {
  user: User | null;
  loading: boolean;
  boot: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
};

export const useAuth = create<State>((set) => ({
  user: null,
  loading: true,
  setUser: (u) => set({ user: u }),
  boot: async () => {
    try {
      const { access } = await tokens.get();
      if (!access) return set({ loading: false });
      const { user } = await api.get<{ user: User }>("/users/me");
      set({ user, loading: false });
    } catch { set({ loading: false }); }
  },
  login: async (email, password) => {
    const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>("/auth/login", { email, password });
    await tokens.set(res.accessToken, res.refreshToken);
    set({ user: res.user });
  },
  register: async (name, email, password) => {
    const res = await api.post<{ user: User; accessToken: string; refreshToken: string }>("/auth/register", { name, email, password });
    await tokens.set(res.accessToken, res.refreshToken);
    set({ user: res.user });
  },
  logout: async () => {
    const { refresh } = await tokens.get();
    if (refresh) await api.post("/auth/logout", { refreshToken: refresh }).catch(() => {});
    await tokens.clear();
    set({ user: null });
  },
}));