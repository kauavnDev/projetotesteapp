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
        <ThemedText variant="heading" style={{ textAlign: "center", fontSize: 34 }}>Forge o seu amanhÃ£</ThemedText>
        <ThemedText variant="muted" style={{ textAlign: "center", fontSize: 16 }}>
          Construa rotinas, metas e disciplina, um dia de cada vez.
        </ThemedText>
        <View style={{ height: spacing.xl }} />
        <Button label="ComeÃ§ar" onPress={() => router.push("/(onboarding)/savings-plan")} />
      </View>
    </Screen>
  );
}