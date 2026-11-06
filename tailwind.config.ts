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
        burgundy: {
          50: "#fdf3f5",
          100: "#fbe4e8",
          200: "#f7cbd3",
          300: "#f0a3b2",
          400: "#e5728a",
          500: "#d34665",
          600: "#bc2e4e",
          700: "#9c1e3a",
          800: "#821b32",
          900: "#5a0f20",
          950: "#380612", // deep luxury velvet burgundy
        },
        gold: {
          50: "#fdfbf5",
          100: "#f9f4e6",
          200: "#f3e7c8",
          300: "#e9d49e",
          400: "#ddbd70",
          500: "#d4af37", // elegant luxury gold
          600: "#b58f26",
          700: "#916d20",
          800: "#765620",
          900: "#63471f",
          950: "#39260c",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Cairo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -5px rgba(56, 6, 18, 0.12)",
        goldGlow: "0 0 25px -5px rgba(212, 175, 55, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
