import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0C0F",
        cardPrimary: "#15171D",
        cardSecondary: "#20232B",
        textPrimary: "#F3F4F6",
        textSecondary: "#B1B6C2",
        borderSubtle: "#2D313C",
        burgundy: {
          50: "#fdf2f4",
          100: "#fbe4e8",
          200: "#f8cbd3",
          300: "#f0a3b2",
          400: "#e5728a",
          500: "#641C32", // Primary Burgundy from Brief
          600: "#541629",
          700: "#451221",
          800: "#3D1021", // Deep Burgundy from Brief
          900: "#2d0a18",
          950: "#1a050d",
        },
        gold: {
          400: "#e6c66e",
          500: "#D4AF37",
          600: "#b9942a",
        },
        ivory: "#FAF7F2",
      },
      fontFamily: {
        sans: ["'IBM Plex Sans Arabic'", "'Alexandria'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Alexandria'", "system-ui", "-apple-system", "sans-serif"],
        editorial: ["Cinzel", "Georgia", "serif"],
        formula: ["JetBrains Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        editorial: "0 20px 40px -15px rgba(0, 0, 0, 0.7)",
        burgundyGlow: "0 0 30px -5px rgba(100, 28, 50, 0.35)",
        goldGlow: "0 0 25px -5px rgba(212, 175, 55, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
