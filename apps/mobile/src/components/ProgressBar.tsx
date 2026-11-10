import React from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";

export function ProgressBar({ value, height = 10 }: { value: number; height?: number }) {
  const { colors, radius } = useTheme();
  const clamped = Math.min(1, Math.max(0, value));
  const p = useSharedValue(clamped);
  React.useEffect(() => { p.value = withTiming(clamped, { duration: 500 }); }, [clamped]);
  const style = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={{ height, backgroundColor: colors.surfaceAlt, borderRadius: radius.full, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%" }, style]}>
        <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}