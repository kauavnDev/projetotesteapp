import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";

export default function TabsLayout() {
  const { colors, fonts } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingBottom: 8, paddingTop: 8 },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 11 },
    }}>
      <Tabs.Screen name="index"  options={{ title: "InÃ­cio",  tabBarIcon: ({ color, size }) => <Ionicons name="flame" color={color} size={size} /> }} />
      <Tabs.Screen name="rotina" options={{ title: "Rotina",  tabBarIcon: ({ color, size }) => <Ionicons name="repeat" color={color} size={size} /> }} />
      <Tabs.Screen name="metas"  options={{ title: "Metas",   tabBarIcon: ({ color, size }) => <Ionicons name="flag" color={color} size={size} /> }} />
      <Tabs.Screen name="corpo"  options={{ title: "Corpo",   tabBarIcon: ({ color, size }) => <Ionicons name="camera" color={color} size={size} /> }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil",  tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }} />
    </Tabs>
  );
}