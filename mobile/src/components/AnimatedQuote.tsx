import React, { useEffect } from "react";
import { View, AccessibilityInfo } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme";
import { ThemedText } from "./Text";

export function AnimatedQuote({ text, author, refreshKey }: { text: string; author?: string | null; refreshKey: string }) {
  const { colors, radius } = useTheme();
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);
  const glow = useSharedValue(0.25);
  const [reduce, setReduce] = React.useState(false);

  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setReduce); }, []);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.exp) });
    if (!reduce) {
      glow.value = withRepeat(withSequence(
        withTiming(0.65, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.25, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true);
    }
  }, [refreshKey, reduce]);

  const card = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const gl = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ borderRadius: radius["2xl"], overflow: "hidden" }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0 }, gl]}>
        <LinearGradient colors={[colors.primary, colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View style={[card, {
        backgroundColor: colors.surface, borderRadius: radius["2xl"],
        borderWidth: 1, borderColor: colors.border, padding: 24, minHeight: 160, justifyContent: "center",
      }]}>
        <ThemedText variant="heading" style={{ fontSize: 22, lineHeight: 30 }}>â€œ{text}â€</ThemedText>
        {!!author && <ThemedText variant="muted" style={{ marginTop: 10 }}>â€” {author}</ThemedText>}
      </Animated.View>
    </View>
  );
}