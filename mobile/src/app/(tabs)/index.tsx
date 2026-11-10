import React, { useCallback, useEffect, useState } from "react";
import { View, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Card } from "../../components/Card";
import { AnimatedQuote } from "../../components/AnimatedQuote";
import { ProgressBar } from "../../components/ProgressBar";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { api } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import { useTheme } from "../../theme";
import { formatBRL } from "../../lib/format";

type Quote = { id: string; text: string; author: string | null };
type Plan = { amountCents: number; frequency: "daily" | "weekly" | "monthly" } | null;
type Entry = { id: string; amountCents: number; date: string };
type Goal = { id: string; title: string; progressPct: number; targetAmountCents: number | null };
type Task = { id: string; title: string; completed: boolean };

export default function Home() {
  const { colors, spacing } = useTheme();
  const user = useAuth(s => s.user)!;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [plan, setPlan] = useState<Plan>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayAmount, setTodayAmount] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [q, p, e, g, t] = await Promise.all([
      api.get<{ quote: Quote }>("/quotes/random"),
      api.get<{ plan: Plan }>("/savings/plan"),
      api.get<{ entries: Entry[]; totalCents: number }>("/savings/entries"),
      api.get<{ goals: Goal[] }>("/goals"),
      api.get<{ tasks: Task[] }>("/routines/today"),
    ]);
    setQuote(q.quote); setPlan(p.plan); setEntries(e.entries);
    setGoals(g.goals.filter(x => x.progressPct < 100)); setTasks(t.tasks);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalCents = entries.reduce((s, e) => s + e.amountCents, 0);
  const todayDone = entries.some(e => e.date === new Date().toISOString().slice(0, 10));

  const submitToday = async () => {
    const cents = Math.round(parseFloat(todayAmount.replace(",", ".")) * 100);
    if (!cents || cents <= 0) return;
    await api.post("/savings/entries", {
      amountCents: cents,
      date: new Date().toISOString().slice(0, 10),
    });
    setTodayAmount("");
    await load();
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      <View style={{ gap: 4 }}>
        <ThemedText variant="heading">OlÃ¡, {user.name.split(" ")[0]}</ThemedText>
        <ThemedText variant="muted">Bora forjar o hoje.</ThemedText>
      </View>

      {quote && <AnimatedQuote text={quote.text} author={quote.author} refreshKey={quote.id} />}

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ThemedText variant="title">PoupanÃ§a</ThemedText>
          <ThemedText variant="muted">{plan ? `Meta ${plan.frequency}` : "sem plano"}</ThemedText>
        </View>
        <ThemedText variant="heading" style={{ fontSize: 32, marginTop: 8 }}>{formatBRL(totalCents)}</ThemedText>
        <ThemedText variant="muted">guardado atÃ© agora</ThemedText>
        <View style={{ flexDirection: "row", gap: 8, marginTop: spacing.md, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder={plan ? `Ex.: ${(plan.amountCents / 100).toFixed(2)}` : "Quanto guardou hoje?"}
              keyboardType="decimal-pad" value={todayAmount} onChangeText={setTodayAmount}
            />
          </View>
          <Button label={todayDone ? "Atualizar" : "Guardar"} onPress={submitToday} />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ThemedText variant="title">Rotina de hoje</ThemedText>
          <Pressable onPress={() => router.push("/(tabs)/rotina")}>
            <ThemedText style={{ color: colors.primary }}>ver tudo</ThemedText>
          </Pressable>
        </View>
        {tasks.length === 0 ? (
          <ThemedText variant="muted" style={{ marginTop: 8 }}>
            Nada agendado. Crie sua primeira rotina.
          </ThemedText>
        ) : tasks.slice(0, 3).map(t => (
          <View key={t.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.completed ? colors.success : colors.warning }} />
            <ThemedText style={{ flex: 1, textDecorationLine: t.completed ? "line-through" : "none" }}>{t.title}</ThemedText>
          </View>
        ))}
      </Card>

      {goals.length > 0 && (
        <Card>
          <ThemedText variant="title">Metas em andamento</ThemedText>
          {goals.slice(0, 2).map(g => (
            <View key={g.id} style={{ marginTop: 12, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ThemedText>{g.title}</ThemedText>
                <ThemedText variant="muted">{g.progressPct}%</ThemedText>
              </View>
              <ProgressBar value={g.progressPct / 100} />
            </View>
          ))}
        </Card>
      )}

      <Pressable onPress={() => router.push("/motivacao")}>
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <ThemedText variant="title">MotivaÃ§Ã£o</ThemedText>
          <ThemedText variant="muted">Ver todas as frases</ThemedText>
        </Card>
      </Pressable>
    </Screen>
  );
}