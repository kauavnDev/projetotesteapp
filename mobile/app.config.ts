// apps/mobile/app.config.ts
import type { ExpoConfig } from "expo/config";
import type { WithAndroidWidgetsParams } from "react-native-android-widget";

const widgetConfig: WithAndroidWidgetsParams = {
  widgets: [
    {
      name: "QuoteWidget",
      label: "Frase Motivacional",
      description: "Uma frase para te inspirar todos os dias.",
      minWidth: "180dp",
      minHeight: "110dp",
      targetCellWidth: 3,
      targetCellHeight: 2,
      updatePeriodMillis: 1800000, // 30 minutos
      // previewImage: './assets/widget-preview/quote.png', // Opcional
    },
    {
      name: "SavingsWidget",
      label: "Poupança",
      description: "Acompanhe quanto você já guardou.",
      minWidth: "180dp",
      minHeight: "110dp",
      targetCellWidth: 3,
      targetCellHeight: 2,
      updatePeriodMillis: 1800000,
    },
    {
      name: "RoutineWidget",
      label: "Rotina de Hoje",
      description: "Veja suas tarefas do dia.",
      minWidth: "180dp",
      minHeight: "110dp",
      targetCellWidth: 3,
      targetCellHeight: 2,
      updatePeriodMillis: 1800000,
    },
  ],
};

const config: ExpoConfig = {
  // ... (o resto da sua configuração: name, slug, etc.)
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    ["expo-image-picker", { /* ... */ }],
    ["expo-notifications", { /* ... */ }],
    ["react-native-android-widget", widgetConfig], // ✅ Configuração correta
  ],
  // ...
};

export default config;