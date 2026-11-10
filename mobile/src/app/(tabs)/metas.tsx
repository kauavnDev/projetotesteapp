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