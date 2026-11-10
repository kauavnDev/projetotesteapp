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
        <ThemedText variant="heading">MotivaÃ§Ã£o diÃ¡ria</ThemedText>
        <ThemedText variant="muted">
          VocÃª vai receber uma frase motivacional por dia. Pode mudar isso nas configuraÃ§Ãµes.
        </ThemedText>
        <Button label="ComeÃ§ar agora" onPress={finish} loading={busy} />
      </View>
    </Screen>
  );
}