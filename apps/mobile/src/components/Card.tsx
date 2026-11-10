import React from "react";
import { View, type ViewProps } from "react-native";
import { useTheme } from "../theme";

export function Card({ style, ...rest }: ViewProps) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={[{
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1, borderColor: colors.border,
      padding: spacing.lg,
    }, style]} {...rest} />
  );
}