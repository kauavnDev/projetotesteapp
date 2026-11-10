import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { palettes, type Palette } from "./colors";
import { spacing, radius } from "./spacing";
import { fontFamilies, fontSizes } from "./typography";

type Mode = "light" | "dark" | "system";
type ThemeCtx = {
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fontFamilies;
  sizes: typeof fontSizes;
  scheme: "light" | "dark";
  mode: Mode;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ mode = "system", children }: { mode?: Mode; children: React.ReactNode }) {
  const sys = useColorScheme();
  const scheme = mode === "system" ? (sys ?? "light") : mode;
  const value = useMemo<ThemeCtx>(() => ({
    colors: palettes[scheme],
    spacing, radius,
    fonts: fontFamilies, sizes: fontSizes,
    scheme, mode,
  }), [scheme, mode]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme fora do ThemeProvider");
  return v;
}