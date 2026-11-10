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