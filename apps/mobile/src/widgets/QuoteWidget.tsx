import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetData } from "./widget-data";

export function QuoteWidget({ data }: { data: WidgetData }) {
  return (
    <FlexWidget clickAction="OPEN_APP" style={{
      height: "match_parent", width: "match_parent", backgroundColor: "#0B0B0F",
      borderRadius: 24, padding: 16, flexDirection: "column", justifyContent: "center",
    }}>
      <TextWidget text="FORGE" style={{ fontSize: 10, color: "#F43F5E", letterSpacing: 2, marginBottom: 8 }} />
      <TextWidget text={data.quote ?? "Forje o seu amanhÃ£."}
        style={{ fontSize: 15, color: "#FAFAFB", fontWeight: "700", fontStyle: "italic" }} />
      {!!data.author && <TextWidget text={`- ${data.author}`} style={{ fontSize: 11, color: "#A1A1AA", marginTop: 8 }} />}
    </FlexWidget>
  );
}