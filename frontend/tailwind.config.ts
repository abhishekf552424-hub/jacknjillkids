import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: { "2xl": "1400px" },
    },
    extend: {
      // Jack & Jill brand tokens — sampled from the logo. Source of truth:
      // the "Jack & Jill Kids" design system (README + tokens.json). Keep the
      // values here and the CSS variables in app/globals.css in sync.
      colors: {
        // Logo colours
        navy: "#354275", // wordmark navy — headings, nav, footer, secondary buttons
        gold: "#B9923F", // ampersand gold — decoration only (borders, stars, dividers)
        "gold-text": "#8A6A22", // gold-coloured text on white/cream (4.8:1)
        "gold-light": "#E2C47E", // gold-coloured text on navy (5.7:1)
        "brand-red": "#EA4137", // Jack's J
        "brand-orange": "#F38838",
        "brand-yellow": "#FCD325", // Jill's J — badges with ink text
        doodle: "#3661A0", // line colour of the kids' faces — icons, links, focus
        // Text + grounds
        ink: "#1F2650",
        muted: "#5B6280", // ink-muted
        cream: "#FFF8EC",
        butter: "#FFF3C4",
        blush: "#FDE4E1",
        sky: "#E6EDF8",
        line: "#E8DFCC",
        "line-strong": "#9A8F78",
        // Action + states
        action: "#C8302A", // the one primary CTA colour (white text 5.4:1)
        "action-hover": "#A9251F",
        success: "#1F7A4A",
        warning: "#8A5A00",
        error: "#B3261E",
        // Rise gradient stops (from the J arrows)
        "grad-start": "#EA4137",
        "grad-mid": "#F38838",
        "grad-end": "#FCD325",
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-deva)", "Arial Rounded MT Bold", "system-ui", "sans-serif"], // Fredoka — headings
        hero: ["var(--font-display)", "var(--font-deva)", "Arial Rounded MT Bold", "system-ui", "sans-serif"], // Fredoka — hero lines
        body: ["var(--font-body)", "system-ui", "sans-serif"], // Nunito
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        hand: ["var(--font-hand)", "cursive"], // Patrick Hand — doodle notes
        deva: ["var(--font-deva)", "var(--font-body)", "sans-serif"], // Baloo 2 — Marathi/Hindi
      },
      borderRadius: {
        sm: "12px",
        DEFAULT: "16px",
        lg: "20px",
        xl: "24px",
      },
      backgroundImage: {
        // Use at most once per screen and never behind text.
        "brand-gradient": "linear-gradient(135deg, #EA4137 0%, #F38838 50%, #FCD325 100%)",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(53,66,117,0.08)",
        premium: "0 14px 30px -12px rgba(53,66,117,0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 500ms cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-right": "slide-in-right 400ms cubic-bezier(0.22,1,0.36,1) both",
        marquee: "marquee 30s linear infinite",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
