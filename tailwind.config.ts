import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // shadcn-style tokens (backend WIP components)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Confidence palette — honest source colors
        confirmed: "hsl(142 71% 45%)",
        community: "hsl(199 89% 48%)",
        likely: "hsl(38 92% 50%)",
        backup: "hsl(0 0% 60%)",
        // Premium UI palettes (front-end)
        miro: {
          bg: "#050508",
          canvas: "#0a0c14",
          card: "#0c0c12",
          ink: "#f0f0f5",
          "ink-muted": "#8b8b9a",
          "ink-subtle": "#5f5f70",
          border: "rgba(255,255,255,0.08)",
          yellow: "#F5C518",
          "yellow-hover": "#e8b800",
          purple: "#6366f1",
          "purple-soft": "rgba(99,102,241,0.15)",
          coral: "#FF6B6B",
          mint: "#4ade80",
          france: "#2563eb",
          senegal: "#16a34a",
        },
        premium: {
          bg: "#050508",
          surface: "#0a0c14",
          card: "#0c0c12",
          elevated: "#12121a",
          border: "rgba(255,255,255,0.07)",
          muted: "#8b8b9a",
          cream: "#f0ece4",
          gold: "#F5C518",
          live: "#FF3B30",
        },
        pitch: {
          950: "#050508",
          900: "#0a0c14",
          800: "#0c0c12",
          700: "#12121a",
          600: "#1a1a24",
        },
        accent: {
          gold: "#F5C518",
          crowd: "#6554ff",
          calm: "#4ade80",
          live: "#6366f1",
          neutral: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        miro: "16px",
        "miro-lg": "24px",
      },
      boxShadow: {
        panel: "0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
        "panel-lg": "0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
        miro: "0 2px 16px rgba(0,0,0,0.35)",
        score: "0 8px 48px rgba(0,0,0,0.6), 0 0 80px rgba(37,99,235,0.12)",
        glow: "0 0 40px rgba(245, 197, 24, 0.15)",
      },
      animation: {
        "pulse-live": "pulse-live 2s ease-in-out infinite",
        "score-flash": "score-flash 0.6s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "score-flash": {
          "0%": { transform: "scale(1.08)", opacity: "0.85" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
