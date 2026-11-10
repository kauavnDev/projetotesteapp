import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 500: "#E11D48", 600: "#BE123C" },
        ink: "#0B0B0F", surface: "#15151C",
      },
    },
  },
  plugins: [],
} satisfies Config;