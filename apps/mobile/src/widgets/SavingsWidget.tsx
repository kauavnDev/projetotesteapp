import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetData } from "./widget-data";

export function SavingsWidget({ data }: { data: WidgetData }) {
  const v = ((data.savedCents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <FlexWidget clickAction="OPEN_APP" style={{
      height: "match_parent", width: "match_parent", backgroundColor: "#15151C",
      borderRadius: 24, padding: 16, flexDirection: "column", justifyContent: "space-between",
    }}>
      <TextWidget text="GUARDADO" style={{ fontSize: 10, color: "#A1A1AA", letterSpacing: 2 }} />
      <TextWidget text={v} style={{ fontSize: 22, color: "#F43F5E", fontWeight: "700" }} />
      <TextWidget text={data.firstTask ? `Hoje: ${data.firstTask}` : "Bora guardar hoje?"}
        style={{ fontSize: 12, color: "#FAFAFB" }} />
    </FlexWidget>
  );
}