import type { Config } from "tailwindcss";

const c = (n: string) => `hsl(var(--${n}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        heroDrift: { from: { transform: "scale(1)" }, to: { transform: "scale(1.06)" } },
        heroFade: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        heroFill: { from: { width: "0%" }, to: { width: "100%" } },
      },
      colors: {
        background: c("background"), foreground: c("foreground"), border: c("border"), "border-strong": c("border-strong"), card: c("card"),
        primary: { DEFAULT: c("primary"), foreground: c("primary-foreground") },
        muted: { DEFAULT: c("muted"), foreground: c("muted-foreground") },
        inverse: { DEFAULT: c("inverse"), foreground: c("inverse-foreground") },
        accent: c("accent"), brand: c("brand"), "on-accent": c("on-accent"), ring: c("ring"),
        success: c("success"), "success-text": c("success-text"), warning: c("warning"), "warning-text": c("warning-text"),
        info: c("info"), verified: c("verified"), destructive: c("destructive"),
      },
      // Softer corners everywhere: controls 12px, cards 20px, sheets 24px. (Whole-app scale, so admin and site stay consistent.)
      borderRadius: { none: "0", sm: "0.5rem", DEFAULT: "0.625rem", md: "0.75rem", lg: "0.875rem", xl: "1rem", "2xl": "1.25rem", "3xl": "1.5rem", full: "9999px", card: "1.25rem" },
      fontFamily: { sans: ['"Jost Variable"', "Jost", '"Inter Variable"', "Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      // Fluid type scale (spec): Display 44→72, H1 36→56, H2 28→40, H3 20→24, Body 16, Small 14, Micro 12.
      fontSize: {
        display: ["clamp(2.75rem, 1.9rem + 3.6vw, 4.5rem)", { lineHeight: "1.04", letterSpacing: "-0.02em", fontWeight: "600" }],
        h1: ["clamp(2.25rem, 1.7rem + 2.4vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
        micro: ["0.75rem", { lineHeight: "1.4" }],
      },
      boxShadow: { hover: "0 1px 2px rgb(0 0 0 / .04), 0 8px 24px rgb(0 0 0 / .06)" },
      transitionDuration: { 240: "240ms", 400: "400ms" },
      transitionTimingFunction: { ui: "cubic-bezier(.2,.8,.2,1)" },
      maxWidth: { site: "1240px" },
    },
  },
  plugins: [],
};
export default config;
