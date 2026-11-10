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
      <ThemedText variant="heading">ConfiguraÃ§Ãµes</ThemedText>
      <Card>
        <ThemedText variant="title">Tema</ThemedText>
        <ThemedText variant="muted">O app segue o tema do sistema ({scheme})</ThemedText>
      </Card>

      <Card>
        <ThemedText variant="title">Conta</ThemedText>
        <ThemedText variant="muted">{user?.email}</ThemedText>
      </Card>

      <ThemedText variant="muted" style={{ marginTop: spacing.lg, textAlign: "center" }}>
        Forge o seu amanhÃ£ Â· v1.0.0
      </ThemedText>
    </Screen>
  );
}