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
          <ThemedText variant="muted">{r.scheduleType} Â· {r.tasks.length} tarefas</ThemedText>
        </Card>
      ))}
    </Screen>
  );
}