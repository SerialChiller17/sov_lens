import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        card: "hsl(var(--card, 0 0% 3%))",
        "card-foreground": "hsl(var(--card-foreground, 0 0% 98%))",
        muted: "hsl(var(--muted, 0 0% 12%))",
        "muted-foreground": "hsl(var(--muted-foreground, 0 0% 64%))",
      },
      boxShadow: {
        "3xl": "0 35px 80px rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
