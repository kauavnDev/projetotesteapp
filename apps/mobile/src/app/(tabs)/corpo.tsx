import React, { useEffect, useState } from "react";
import { View, Image, Pressable, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/Screen";
import { ThemedText } from "../../components/Text";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { api } from "../../lib/api";
import { useTheme } from "../../theme";

type Checkin = {
  id: string; date: string; weightGrams: number | null;
  mood: number | null; energy: number | null; notes: string | null; photoUrl: string | null;
};

export default function Corpo() {
  const { colors, spacing } = useTheme();
  const [items, setItems] = useState<Checkin[]>([]);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { checkins } = await api.get<{ checkins: Checkin[] }>("/body");
    setItems(checkins);
  };
  useEffect(() => { load(); }, []);

  const pick = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true, allowsEditing: true, aspect: [3, 4] });
    if (!res.canceled && res.assets[0].base64) setPhotoBase64(`data:image/jpeg;base64,${res.assets[0].base64}`);
  };

  const save = async () => {
    const w = parseFloat(weight.replace(",", "."));
    await api.post("/body", {
      date: new Date().toISOString().slice(0, 10),
      weightGrams: Number.isFinite(w) ? Math.round(w * 1000) : undefined,
      notes: notes || undefined,
      photoBase64: photoBase64 ?? undefined,
    });
    setPhotoBase64(null); setWeight(""); setNotes(""); await load();
  };

  return (
    <Screen>
      <ThemedText variant="heading">Seu corpo hoje</ThemedText>
      <Card>
        <Pressable onPress={pick} accessibilityLabel="Tirar foto do check-in">
          {photoBase64 ? (
            <Image source={{ uri: photoBase64 }} style={{ width: "100%", height: 260, borderRadius: 16 }} />
          ) : (
            <View style={{ height: 200, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
              <ThemedText variant="muted">Toque para tirar foto</ThemedText>
            </View>
          )}
        </Pressable>
        <View style={{ height: spacing.md }} />
        <Input placeholder="Peso (kg) â€” opcional" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
        <View style={{ height: spacing.sm }} />
        <Input placeholder="AnotaÃ§Ãµes â€” opcional" value={notes} onChangeText={setNotes} />
        <View style={{ height: spacing.md }} />
        <Button label="Salvar check-in" onPress={save} />
      </Card>

      <ThemedText variant="title" style={{ marginTop: spacing.lg }}>HistÃ³rico</ThemedText>
      {items.length === 0 && <ThemedText variant="muted">Sem check-ins ainda.</ThemedText>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
        {items.map(c => (
          <Card key={c.id} style={{ width: 160 }}>
            {c.photoUrl
              ? <Image source={{ uri: c.photoUrl }} style={{ width: "100%", height: 180, borderRadius: 12 }} />
              : <View style={{ height: 180, borderRadius: 12, backgroundColor: colors.surfaceAlt }} />}
            <ThemedText variant="small" style={{ marginTop: 8 }}>{c.date}</ThemedText>
            {c.weightGrams && <ThemedText variant="small">{(c.weightGrams / 1000).toFixed(1)} kg</ThemedText>}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}