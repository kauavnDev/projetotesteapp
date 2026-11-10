import React from "react";
import { Pressable, ActivityIndicator, type PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "../theme";
import { ThemedText } from "./Text";

type Variant = "primary" | "ghost" | "danger";

export function Button({ label, onPress, variant = "primary", loading, disabled, style, ...rest }: PressableProps & {
  label: string; variant?: Variant; loading?: boolean;
}) {
  const { colors, radius, fonts, sizes } = useTheme();
  const scale = useSharedValue(1);
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.error : "transparent";
  const fg = variant === "ghost" ? colors.primary : "#FFFFFF";
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={anim}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
        disabled={disabled || loading}
        onPressIn={() => { scale.value = withTiming(0.97, { duration: 90 }); }}
        onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
        onPress={(e) => { Haptics.selectionAsync(); onPress?.(e); }}
        style={[{
          backgroundColor: bg,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: colors.primary,
          borderRadius: radius.lg,
          minHeight: 48, justifyContent: "center", alignItems: "center",
          paddingHorizontal: 20, opacity: disabled ? 0.4 : 1,
        }, style]}
        {...rest}
      >
        {loading ? <ActivityIndicator color={fg} /> :
          <ThemedText style={{ color: fg, fontFamily: fonts.bodySemi, fontSize: sizes.base }}>{label}</ThemedText>}
      </Pressable>
    </Animated.View>
  );
}