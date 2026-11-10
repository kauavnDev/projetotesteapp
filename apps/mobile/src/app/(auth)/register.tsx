import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAuth } from "../../stores/auth";
import { useTheme } from "../../theme";

export default function Register() {
  const { colors, spacing } = useTheme();
  const register = useAuth(s => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null);
    try { await register(name.trim(), email.trim(), password); router.replace("/"); }
    catch (e: any) { setErr(e?.error?.message ?? "Falha ao criar conta"); }
    finally { setBusy(false); }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg, padding: 20 }}>
        <ThemedText variant="heading">Criar conta</ThemedText>
        <ThemedText variant="muted">Comece a forjar seu amanhÃ£.</ThemedText>
        <Input placeholder="Nome" value={name} onChangeText={setName} />
        <Input placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Senha (mÃ­n. 8)" secureTextEntry value={password} onChangeText={setPassword} />
        {!!err && <ThemedText style={{ color: colors.error }}>{err}</ThemedText>}
        <Button label="Criar conta" onPress={submit} loading={busy} />
        <Button label="JÃ¡ tenho conta" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}