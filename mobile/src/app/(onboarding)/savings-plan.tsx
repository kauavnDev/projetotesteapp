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
        <ThemedText variant="heading">Quanto vocÃª quer guardar?</ThemedText>
        <ThemedText variant="muted">VocÃª pode mudar isso quando quiser.</ThemedText>
        <Input placeholder="R$" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["daily", "weekly", "monthly"] as const).map(f => (
            <View key={f} style={{ flex: 1 }}>
              <Button label={{ daily: "Por dia", weekly: "Por semana", monthly: "Por mÃªs" }[f]}
                variant={freq === f ? "primary" : "ghost"} onPress={() => setFreq(f)} />
            </View>
          ))}
        </View>
        <Button label="Continuar" onPress={save} loading={busy} />
      </View>
    </Screen>
  );
}