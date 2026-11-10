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
      <ThemedText variant="heading">PoupanÃ§a</ThemedText>

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
                label={{ daily: "Dia", weekly: "Semana", monthly: "MÃªs" }[f]}
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

      <ThemedText variant="title">HistÃ³rico</ThemedText>
      {entries.length === 0 && <ThemedText variant="muted">Sem depÃ³sitos ainda.</ThemedText>}
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