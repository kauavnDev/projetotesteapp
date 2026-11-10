import React from "react";
import { Text as RNText, type TextProps } from "react-native";
import { useTheme } from "../theme";

type Variant = "heading" | "title" | "body" | "muted" | "small" | "label";

export function ThemedText({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  const { colors, fonts, sizes } = useTheme();
  const map: Record<Variant, object> = {
    heading: { fontFamily: fonts.heading, fontSize: sizes["2xl"], color: colors.text },
    title:   { fontFamily: fonts.heading, fontSize: sizes.xl,    color: colors.text },
    body:    { fontFamily: fonts.body,    fontSize: sizes.base,  color: colors.text },
    muted:   { fontFamily: fonts.body,    fontSize: sizes.sm,    color: colors.textMuted },
    small:   { fontFamily: fonts.body,    fontSize: sizes.xs,    color: colors.textMuted },
    label:   { fontFamily: fonts.bodySemi,fontSize: sizes.sm,    color: colors.text },
  };
  return <RNText allowFontScaling maxFontSizeMultiplier={1.6} style={[map[variant], style]} {...rest} />;
}