import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../stores/auth";
import { useTheme } from "../../theme";

export default function Login() {
  const { colors, spacing } = useTheme();
  const login = useAuth(s => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null);
    try { await login(email.trim(), password); router.replace("/"); }
    catch (e: any) { setErr(e?.error?.message ?? "Falha ao entrar"); }
    finally { setBusy(false); }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading">Bem-vindo de volta</ThemedText>
        <ThemedText variant="muted">Continue forjando seu amanhÃ£.</ThemedText>
        <Input placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Senha" secureTextEntry value={password} onChangeText={setPassword} />
        {!!err && <ThemedText style={{ color: colors.error }}>{err}</ThemedText>}
        <Button label="Entrar" onPress={submit} loading={busy} />
        <Button label="Criar conta" variant="ghost" onPress={() => router.push("/(auth)/register")} />
      </View>
    </Screen>
  );
}