import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

const KEY = "forge.widget.cache";

export type WidgetData = {
  quote?: string;
  author?: string | null;
  savedCents?: number;
  planAmountCents?: number;
  planFrequency?: string;
  firstTask?: string | null;
  tasksDone?: number;
  tasksTotal?: number;
};

export async function loadWidgetData(): Promise<WidgetData> {
  try {
    const [q, s, t] = await Promise.all([
      api.get<{ quote: { text: string; author: string | null } }>("/quotes/random"),
      api.get<{ entries: { amountCents: number }[] }>("/savings/entries"),
      api.get<{ tasks: { title: string; completed: boolean }[] }>("/routines/today"),
    ]);
    const saved = s.entries.reduce((a, b) => a + b.amountCents, 0);
    const data: WidgetData = {
      quote: q.quote.text, author: q.quote.author,
      savedCents: saved,
      firstTask: t.tasks[0]?.title ?? null,
      tasksDone: t.tasks.filter(x => x.completed).length,
      tasksTotal: t.tasks.length,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    return data;
  } catch {
    const cached = await AsyncStorage.getItem(KEY);
    return cached ? JSON.parse(cached) : {};
  }
}