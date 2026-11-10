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
          <ThemedText variant="title">PoupanÃ§a</ThemedText>
          <ThemedText variant="muted">Plano e histÃ³rico</ThemedText>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/motivacao")}>
        <Card>
          <ThemedText variant="title">MotivaÃ§Ã£o</ThemedText>
          <ThemedText variant="muted">Todas as frases</ThemedText>
        </Card>
      </Pressable>

      <Pressable onPress={() => router.push("/configuracoes")}>
        <Card>
          <ThemedText variant="title">ConfiguraÃ§Ãµes</ThemedText>
          <ThemedText variant="muted">Tema, notificaÃ§Ãµes</ThemedText>
        </Card>
      </Pressable>

      <View style={{ height: spacing.lg }} />
      <Button label="Sair" variant="ghost" onPress={async () => { await logout(); router.replace("/"); }} />
    </Screen>
  );
}