import type { Config } from "tailwindcss";

// Locked IAS tokens surfaced as Tailwind theme extensions.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0A2E36",
        secondary: "#3F7266",
        accent: "#00E5A3",
        "accent-600": "#00B882",
        dark: "#111827",
        muted: "#6B7280",
        light: "#F9FAFB",
        mid: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        btn: "5px",
      },
    },
  },
  plugins: [],
};
export default config;
