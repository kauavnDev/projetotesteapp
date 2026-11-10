export const palettes = {
  light: {
    bg: "#FAFAFB", surface: "#FFFFFF", surfaceAlt: "#F4F4F7", border: "#E5E7EB",
    text: "#0B0B0F", textMuted: "#6B7280", primary: "#E11D48", primaryPressed: "#BE123C",
    primarySoft: "#FFE4E6", accent: "#FB923C", success: "#10B981", warning: "#F59E0B",
    error: "#EF4444", overlay: "rgba(0,0,0,0.4)",
  },
  dark: {
    bg: "#0B0B0F", surface: "#15151C", surfaceAlt: "#1E1E28", border: "#2A2A35",
    text: "#FAFAFB", textMuted: "#A1A1AA", primary: "#F43F5E", primaryPressed: "#E11D48",
    primarySoft: "#3F1121", accent: "#FB923C", success: "#34D399", warning: "#FBBF24",
    error: "#F87171", overlay: "rgba(0,0,0,0.6)",
  },
} as const;

export type Palette = (typeof palettes)["light"];