import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0A2E36", 50: "#E8F0F1", 800: "#062028" },
        secondary: { DEFAULT: "#3F7266", 200: "#9BBEC0", 700: "#2A5047" },
        accent: { DEFAULT: "#00E5A3", 600: "#00B882" },
        ink: "#111827", ash: "#F9FAFB", body: "#374151",
        dark: "#111827", muted: "#6B7280", light: "#F9FAFB", mid: "#E5E7EB", hair: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { page: "72rem" },
      borderRadius: { btn: "5px" },
    },
  },
  plugins: [],
};
export default config;
