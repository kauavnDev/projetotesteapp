import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { WidgetData } from "./widget-data";

export function RoutineWidget({ data }: { data: WidgetData }) {
  return (
    <FlexWidget clickAction="OPEN_APP" style={{
      height: "match_parent", width: "match_parent", backgroundColor: "#15151C",
      borderRadius: 24, padding: 16, flexDirection: "column",
    }}>
      <TextWidget text="ROTINA HOJE" style={{ fontSize: 10, color: "#A1A1AA", letterSpacing: 2 }} />
      <TextWidget text={`${data.tasksDone ?? 0}/${data.tasksTotal ?? 0} feitas`}
        style={{ fontSize: 20, color: "#FB923C", fontWeight: "700", marginTop: 6 }} />
      <TextWidget text={data.firstTask ?? "Nada agendado"} style={{ fontSize: 12, color: "#FAFAFB", marginTop: 6 }} />
    </FlexWidget>
  );
}