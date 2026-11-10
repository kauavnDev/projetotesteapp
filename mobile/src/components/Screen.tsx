import React from "react";
import { View, ScrollView, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../theme";

export function Screen({ children, scroll = true, style, ...rest }: { children: React.ReactNode; scroll?: boolean } & ViewProps) {
  const { colors, scheme } = useTheme();
  const content = scroll ? (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : children;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[{ flex: 1, backgroundColor: colors.bg }, style]} {...rest}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {content}
    </SafeAreaView>
  );
}