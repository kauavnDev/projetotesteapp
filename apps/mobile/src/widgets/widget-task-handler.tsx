import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { QuoteWidget } from "./QuoteWidget";
import { SavingsWidget } from "./SavingsWidget";
import { RoutineWidget } from "./RoutineWidget";
import { loadWidgetData } from "./widget-data";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, widgetInfo, renderWidget } = props;
  if (!["WIDGET_ADDED", "WIDGET_UPDATE", "WIDGET_RESIZED"].includes(widgetAction)) return;
  const data = await loadWidgetData();
  switch (widgetInfo.widgetName) {
    case "QuoteWidget":    renderWidget(<QuoteWidget data={data} />); break;
    case "SavingsWidget":  renderWidget(<SavingsWidget data={data} />); break;
    case "RoutineWidget":  renderWidget(<RoutineWidget data={data} />); break;
  }
}