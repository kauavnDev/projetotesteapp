# completar-forge.ps1 — Adiciona os 13 arquivos faltantes (NÃO apaga nada)
$ErrorActionPreference = "Stop"
if (!(Test-Path "apps\mobile\src\app")) {
  throw "Entre na pasta forge-seu-amanha (ou rode setup-forge.ps1 antes)"
}

function W($path, $content) {
  $dir = Split-Path $path -Parent
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [IO.File]::WriteAllText((Join-Path $PWD $path), $content, [Text.UTF8Encoding]::new($false))
  Write-Host "  + $path"
}

Write-Host "Criando arquivos..." -ForegroundColor Cyan

W "apps\mobile\src\app\(tabs)\index.tsx" @'
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
        <ThemedText variant="heading">Olá, {user.name.split(" ")[0]}</ThemedText>
        <ThemedText variant="muted">Bora forjar o hoje.</ThemedText>
      </View>

      {quote && <AnimatedQuote text={quote.text} author={quote.author} refreshKey={quote.id} />}

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ThemedText variant="title">Poupança</ThemedText>
          <ThemedText variant="muted">{plan ? `Meta ${plan.frequency}` : "sem plano"}</ThemedText>
        </View>
        <ThemedText variant="heading" style={{ fontSize: 32, marginTop: 8 }}>{formatBRL(totalCents)}</ThemedText>
        <ThemedText variant="muted">guardado até agora</ThemedText>
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
          <ThemedText variant="title">Motivação</ThemedText>
          <ThemedText variant="muted">Ver todas as frases</ThemedText>
        </Card>
      </Pressable>
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(tabs)\rotina.tsx" @'
import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Card } from "../../components/Card";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";

type Task = { id: string; title: string; completed: boolean };
type Routine = { id: string; title: string; scheduleType: string; tasks: { id: string; title: string }[] };

export default function Rotina() {
  const { colors, spacing } = useTheme();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [today, setToday] = useState<Task[]>([]);

  const load = async () => {
    const [r, t] = await Promise.all([
      api.get<{ routines: Routine[] }>("/routines"),
      api.get<{ tasks: Task[] }>("/routines/today"),
    ]);
    setRoutines(r.routines);
    setToday(t.tasks);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (taskId: string, completed: boolean) => {
    await api.post("/routines/complete", {
      taskId,
      date: new Date().toISOString().slice(0, 10),
      completed: !completed,
    });
    await load();
  };

  return (
    <Screen>
      <ThemedText variant="heading">Rotina</ThemedText>
      <ThemedText variant="title">Hoje</ThemedText>
      {today.length === 0 && <ThemedText variant="muted">Nada agendado para hoje.</ThemedText>}
      {today.map(t => (
        <Pressable key={t.id} onPress={() => toggle(t.id, t.completed)}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{
              width: 24, height: 24, borderRadius: 12,
              borderWidth: 2, borderColor: t.completed ? colors.success : colors.border,
              backgroundColor: t.completed ? colors.success : "transparent",
            }} />
            <ThemedText style={{ flex: 1, textDecorationLine: t.completed ? "line-through" : "none" }}>
              {t.title}
            </ThemedText>
          </Card>
        </Pressable>
      ))}
      <ThemedText variant="title" style={{ marginTop: spacing.lg }}>Todas as rotinas</ThemedText>
      {routines.length === 0 && <ThemedText variant="muted">Nenhuma rotina criada ainda.</ThemedText>}
      {routines.map(r => (
        <Card key={r.id}>
          <ThemedText variant="label">{r.title}</ThemedText>
          <ThemedText variant="muted">{r.scheduleType} · {r.tasks.length} tarefas</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(tabs)\metas.tsx" @'
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ProgressBar } from "../../components/ProgressBar";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";
import { formatBRL } from "../../lib/format";

type Goal = {
  id: string; title: string; description: string | null;
  targetAmountCents: number | null; progressPct: number; status: string;
};

export default function Metas() {
  const { spacing } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");

  const load = async () => {
    const { goals } = await api.get<{ goals: Goal[] }>("/goals");
    setGoals(goals);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    const cents = target ? Math.round(parseFloat(target.replace(",", ".")) * 100) : undefined;
    await api.post("/goals", {
      title, category: "other",
      targetAmountCents: Number.isFinite(cents) ? cents : undefined,
    });
    setTitle(""); setTarget(""); await load();
  };

  const remove = async (id: string) => { await api.del(`/goals/${id}`); await load(); };

  return (
    <Screen>
      <ThemedText variant="heading">Metas</ThemedText>

      <Card>
        <ThemedText variant="title">Nova meta</ThemedText>
        <View style={{ height: spacing.sm }} />
        <Input placeholder="Ex.: viagem, carro, curso..." value={title} onChangeText={setTitle} />
        <View style={{ height: spacing.sm }} />
        <Input placeholder="Valor alvo em R$ (opcional)" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
        <View style={{ height: spacing.md }} />
        <Button label="Criar meta" onPress={create} />
      </Card>

      {goals.length === 0 && <ThemedText variant="muted">Nenhuma meta ainda.</ThemedText>}
      {goals.map(g => (
        <Card key={g.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <ThemedText variant="label" style={{ flex: 1 }}>{g.title}</ThemedText>
            <ThemedText variant="muted">{g.progressPct}%</ThemedText>
          </View>
          <View style={{ height: 8 }} />
          <ProgressBar value={g.progressPct / 100} />
          {g.targetAmountCents && (
            <ThemedText variant="muted" style={{ marginTop: 8 }}>{formatBRL(g.targetAmountCents)}</ThemedText>
          )}
          <View style={{ height: spacing.sm }} />
          <Button label="Excluir" variant="danger" onPress={() => remove(g.id)} />
        </Card>
      ))}
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(tabs)\perfil.tsx" @'
import React from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useAuth } from "../../stores/auth";
import { useTheme } from "../../theme";

export default function Perfil() {
  const { spacing } = useTheme();
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Screen>
      <ThemedText variant="heading">Perfil</ThemedText>
      <Card>
        <ThemedText variant="title">{user.name}</ThemedText>
        <ThemedText variant="muted">{user.email}</ThemedText>
        <ThemedText variant="small" style={{ marginTop: 4 }}>perfil: {user.role}</ThemedText>
      </Card>

      <Pressable onPress={() => router.push("/poupanca")}>
        <Card>
          <ThemedText variant="title">Poupança</ThemedText>
          <ThemedText variant="muted">Plano e histórico</ThemedText>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/motivacao")}>
        <Card>
          <ThemedText variant="title">Motivação</ThemedText>
          <ThemedText variant="muted">Todas as frases</ThemedText>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/configuracoes")}>
        <Card>
          <ThemedText variant="title">Configurações</ThemedText>
          <ThemedText variant="muted">Tema, notificações</ThemedText>
        </Card>
      </Pressable>

      <View style={{ height: spacing.lg }} />
      <Button label="Sair" variant="ghost" onPress={async () => { await logout(); router.replace("/"); }} />
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(auth)\register.tsx" @'
import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../stores/auth";
import { useTheme } from "../../theme";

export default function Register() {
  const { colors, spacing } = useTheme();
  const register = useAuth(s => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null);
    try { await register(name.trim(), email.trim(), password); router.replace("/"); }
    catch (e: any) { setErr(e?.error?.message ?? "Falha ao criar conta"); }
    finally { setBusy(false); }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading">Criar conta</ThemedText>
        <ThemedText variant="muted">Comece a forjar seu amanhã.</ThemedText>
        <Input placeholder="Nome" value={name} onChangeText={setName} />
        <Input placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Senha (mín. 8)" secureTextEntry value={password} onChangeText={setPassword} />
        {!!err && <ThemedText style={{ color: colors.error }}>{err}</ThemedText>}
        <Button label="Criar conta" onPress={submit} loading={busy} />
        <Button label="Já tenho conta" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(onboarding)\_layout.tsx" @'
import { Stack } from "expo-router";
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />;
}
'@

W "apps\mobile\src\app\(onboarding)\welcome.tsx" @'
import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme";

export default function Welcome() {
  const { spacing } = useTheme();
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading" style={{ textAlign: "center", fontSize: 34 }}>Forge o seu amanhã</ThemedText>
        <ThemedText variant="muted" style={{ textAlign: "center", fontSize: 16 }}>
          Construa rotinas, metas e disciplina, um dia de cada vez.
        </ThemedText>
        <View style={{ height: spacing.xl }} />
        <Button label="Começar" onPress={() => router.push("/(onboarding)/savings-plan")} />
      </View>
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(onboarding)\savings-plan.tsx" @'
import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";

export default function SavingsPlan() {
  const { spacing } = useTheme();
  const [amount, setAmount] = useState("10");
  const [freq, setFreq] = useState<"daily" | "weekly" | "monthly">("daily");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!cents) return;
    setBusy(true);
    try {
      await api.post("/savings/plan", { amountCents: cents, frequency: freq });
      router.push("/(onboarding)/first-goal");
    } finally { setBusy(false); }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading">Quanto você quer guardar?</ThemedText>
        <ThemedText variant="muted">Você pode mudar isso quando quiser.</ThemedText>
        <Input placeholder="R$" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["daily", "weekly", "monthly"] as const).map(f => (
            <View key={f} style={{ flex: 1 }}>
              <Button label={{ daily: "Por dia", weekly: "Por semana", monthly: "Por mês" }[f]}
                variant={freq === f ? "primary" : "ghost"} onPress={() => setFreq(f)} />
            </View>
          ))}
        </View>
        <Button label="Continuar" onPress={save} loading={busy} />
      </View>
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(onboarding)\first-goal.tsx" @'
import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";

export default function FirstGoal() {
  const { spacing } = useTheme();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  const next = async (skip = false) => {
    if (!skip && title.trim()) {
      setBusy(true);
      try {
        const cents = target ? Math.round(parseFloat(target.replace(",", ".")) * 100) : undefined;
        await api.post("/goals", {
          title, category: "other",
          targetAmountCents: Number.isFinite(cents) ? cents : undefined,
        });
      } finally { setBusy(false); }
    }
    router.push("/(onboarding)/motivation");
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading">Qual sua primeira meta?</ThemedText>
        <ThemedText variant="muted">Pode ser viagem, carro, curso, o que quiser.</ThemedText>
        <Input placeholder="Ex.: juntar R$ 3.000" value={title} onChangeText={setTitle} />
        <Input placeholder="Valor alvo (opcional)" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
        <Button label="Continuar" onPress={() => next(false)} loading={busy} />
        <Button label="Pular" variant="ghost" onPress={() => next(true)} />
      </View>
    </Screen>
  );
}
'@

W "apps\mobile\src\app\(onboarding)\motivation.tsx" @'
import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Button } from "../../components/Button";
import { api } from "../../lib/api";
import { useAuth } from "../../stores/auth";
import { useTheme } from "../../theme";

export default function MotivationOnboarding() {
  const { spacing } = useTheme();
  const setUser = useAuth(s => s.setUser);
  const user = useAuth(s => s.user);
  const [busy, setBusy] = React.useState(false);

  const finish = async () => {
    setBusy(true);
    try {
      await api.patch("/users/me", { onboardingCompleted: true });
      if (user) setUser({ ...user, onboardingCompleted: true });
      router.replace("/(tabs)");
    } finally { setBusy(false); }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading">Motivação diária</ThemedText>
        <ThemedText variant="muted">
          Você vai receber uma frase motivacional por dia. Pode mudar isso nas configurações.
        </ThemedText>
        <Button label="Começar agora" onPress={finish} loading={busy} />
      </View>
    </Screen>
  );
}
'@

W "apps\mobile\src\app\motivacao.tsx" @'
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { ThemedText } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { api } from "../lib/api";

type Quote = { id: string; text: string; author: string | null };

export default function Motivacao() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => { api.get<{ quotes: Quote[] }>("/quotes/all").then(r => setQuotes(r.quotes)); }, []);

  return (
    <Screen>
      <ThemedText variant="heading">Motivação</ThemedText>
      {quotes[i] && (
        <Card>
          <ThemedText variant="heading" style={{ fontSize: 22 }}>{quotes[i].text}</ThemedText>
          {quotes[i].author && <ThemedText variant="muted" style={{ marginTop: 8 }}>- {quotes[i].author}</ThemedText>}
          <View style={{ height: 16 }} />
          <Button label="Próxima frase" onPress={() => setI((i + 1) % quotes.length)} />
        </Card>
      )}
      <ThemedText variant="title">Todas as frases</ThemedText>
      {quotes.map((q) => (
        <Card key={q.id}>
          <ThemedText>{q.text}</ThemedText>
          {q.author && <ThemedText variant="muted" style={{ marginTop: 4 }}>- {q.author}</ThemedText>}
        </Card>
      ))}
    </Screen>
  );
}
'@

W "apps\mobile\src\app\poupanca.tsx" @'
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { ThemedText } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { api } from "../lib/api";
import { useTheme } from "../theme";
import { formatBRL } from "../lib/format";

type Plan = { amountCents: number; frequency: "daily" | "weekly" | "monthly" } | null;
type Entry = { id: string; amountCents: number; date: string; note: string | null };

export default function Poupanca() {
  const { spacing } = useTheme();
  const [plan, setPlan] = useState<Plan>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("10");
  const [freq, setFreq] = useState<"daily" | "weekly" | "monthly">("daily");
  const [newEntry, setNewEntry] = useState("");

  const load = async () => {
    const [p, e] = await Promise.all([
      api.get<{ plan: Plan }>("/savings/plan"),
      api.get<{ entries: Entry[] }>("/savings/entries"),
    ]);
    setPlan(p.plan);
    setEntries(e.entries);
    if (p.plan) { setAmount((p.plan.amountCents / 100).toFixed(2)); setFreq(p.plan.frequency); }
  };
  useEffect(() => { load(); }, []);

  const savePlan = async () => {
    const cents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
    if (!cents) return;
    await api.post("/savings/plan", { amountCents: cents, frequency: freq });
    await load();
  };

  const addEntry = async () => {
    const cents = Math.round(parseFloat(newEntry.replace(",", ".")) * 100);
    if (!cents) return;
    await api.post("/savings/entries", {
      amountCents: cents,
      date: new Date().toISOString().slice(0, 10),
    });
    setNewEntry(""); await load();
  };

  const total = entries.reduce((s, e) => s + e.amountCents, 0);

  return (
    <Screen>
      <ThemedText variant="heading">Poupança</ThemedText>

      <Card>
        <ThemedText variant="title">Plano atual</ThemedText>
        <ThemedText variant="muted">
          {plan ? `${formatBRL(plan.amountCents)} por ${plan.frequency}` : "Nenhum plano definido"}
        </ThemedText>
        <View style={{ height: spacing.sm }} />
        <Input placeholder="Valor (R$)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <View style={{ height: spacing.sm, flexDirection: "row", gap: 8 }}>
          {(["daily", "weekly", "monthly"] as const).map(f => (
            <View key={f} style={{ flex: 1 }}>
              <Button
                label={{ daily: "Dia", weekly: "Semana", monthly: "Mês" }[f]}
                variant={freq === f ? "primary" : "ghost"}
                onPress={() => setFreq(f)}
              />
            </View>
          ))}
        </View>
        <View style={{ height: spacing.md }} />
        <Button label="Salvar plano" onPress={savePlan} />
      </Card>

      <Card>
        <ThemedText variant="title">Total guardado</ThemedText>
        <ThemedText variant="heading" style={{ fontSize: 32, marginTop: 8 }}>{formatBRL(total)}</ThemedText>
        <View style={{ height: spacing.md }} />
        <Input placeholder="Guardar agora (R$)" keyboardType="decimal-pad" value={newEntry} onChangeText={setNewEntry} />
        <View style={{ height: spacing.md }} />
        <Button label="Guardar" onPress={addEntry} />
      </Card>

      <ThemedText variant="title">Histórico</ThemedText>
      {entries.length === 0 && <ThemedText variant="muted">Sem depósitos ainda.</ThemedText>}
      {entries.slice(0, 20).map(e => (
        <Card key={e.id}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <ThemedText>{e.date}</ThemedText>
            <ThemedText variant="label">{formatBRL(e.amountCents)}</ThemedText>
          </View>
          {e.note && <ThemedText variant="muted">{e.note}</ThemedText>}
        </Card>
      ))}
    </Screen>
  );
}
'@

W "apps\mobile\src\app\configuracoes.tsx" @'
import React from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { ThemedText } from "../components/Text";
import { Card } from "../components/Card";
import { useAuth } from "../stores/auth";
import { useTheme } from "../theme";

export default function Configuracoes() {
  const { scheme, spacing } = useTheme();
  const { user } = useAuth();

  return (
    <Screen>
      <ThemedText variant="heading">Configurações</ThemedText>
      <Card>
        <ThemedText variant="title">Tema</ThemedText>
        <ThemedText variant="muted">O app segue o tema do sistema ({scheme})</ThemedText>
      </Card>

      <Card>
        <ThemedText variant="title">Conta</ThemedText>
        <ThemedText variant="muted">{user?.email}</ThemedText>
      </Card>

      <ThemedText variant="muted" style={{ marginTop: spacing.lg, textAlign: "center" }}>
        Forge o seu amanhã · v1.0.0
      </ThemedText>
    </Screen>
  );
}
'@

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " 13 arquivos criados com sucesso!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green