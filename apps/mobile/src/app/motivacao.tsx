import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Screen } from "../components/Screen";
import { ThemedText } from "../components/Text";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { api } from "../lib/api";

type Quote = { id: string; text: string; author: string | null };

export default function Motivacao() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [i, setI] = useState(0);

  useEffect(() => { api.get<{ quotes: Quote[] }>("/quotes/all").then(r => setQuotes(r.quotes)); }, []);

  return (
    <Screen>
      <ThemedText variant="heading">MotivaÃ§Ã£o</ThemedText>
      {quotes[i] && (
        <Card>
          <ThemedText variant="heading" style={{ fontSize: 22 }}>{quotes[i].text}</ThemedText>
          {quotes[i].author && <ThemedText variant="muted" style={{ marginTop: 8 }}>- {quotes[i].author}</ThemedText>}
          <View style={{ height: 16 }} />
          <Button label="PrÃ³xima frase" onPress={() => setI((i + 1) % quotes.length)} />
        </Card>
      )}
      <ThemedText variant="title">Todas as frases</ThemedText>
      {quotes.map((q) => (
        <Card key={q.id}>
          <ThemedText>{q.text}</ThemedText>
          {q.author && <ThemedText variant="muted" style={{ marginTop: 4 }}>- {q.author}</ThemedText>}
        </Card>
      ))}
    </Screen>
  );
}