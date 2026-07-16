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
      colors: {
        navy: "#1E2A4A",
        gold: "#C9992E",
        cream: "#FFF9F2",
        blush: "#FDEEF0",
        sky: "#EAF4FB",
        ink: "#1A1A1A",
        muted: "#6B7280",
        success: "#2E9E5B",
        error: "#D64545",
        "grad-start": "#E63946",
        "grad-mid": "#F4A63E",
        "grad-end": "#F7D34C",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        sm: "12px",
        DEFAULT: "16px",
        lg: "20px",
        xl: "24px",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #E63946 0%, #F4A63E 50%, #F7D34C 100%)",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(30,42,74,0.06)",
        premium: "0 20px 40px -12px rgba(30,42,74,0.15)",
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
