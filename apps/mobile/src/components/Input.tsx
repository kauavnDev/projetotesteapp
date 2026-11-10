import React from "react";
import { View, TextInput, type TextInputProps } from "react-native";
import { useTheme } from "../theme";

export function Input({ style, ...rest }: TextInputProps) {
  const { colors, radius, spacing, fonts, sizes } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.surfaceAlt, borderRadius: radius.lg,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: spacing.lg,
    }}>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[{ color: colors.text, fontFamily: fonts.body, fontSize: sizes.base, minHeight: 48 }, style]}
        {...rest}
      />
    </View>
  );
}