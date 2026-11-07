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
        // Minimal Academic Editorial Palette
        ivory: {
          50: "#FFFFFF",
          100: "#FDFCFB",
          200: "#FAF8F5", // Main canvas
          300: "#F4F1EA", // Secondary surface
          400: "#ECE7DE",
        },
        charcoal: {
          50: "#6B7280",
          100: "#454952", // Clear, high-contrast secondary text
          200: "#2D3036",
          300: "#222429",
          900: "#18191B", // Primary reading text
        },
        hairline: {
          DEFAULT: "#E5E2DC", // 1px structural dividers
          subtle: "#EFECE6",
          strong: "#D1CDC4",
        },
        burgundy: {
          50: "#FAF0F2",
          100: "#F5DEE3",
          200: "#E8B8C2",
          300: "#D48293",
          400: "#A33753",
          500: "#641C32", // Primary Accent
          600: "#541629",
          700: "#451221",
          800: "#3D1021", // Deep Burgundy
          900: "#2E0A18",
        },
        ochre: {
          DEFAULT: "#9E7D2B", // Muted gold / academic mark
          light: "#C5A34E",
          subtle: "#F9F6EE",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "'Plus Jakarta Sans'", "-apple-system", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        editorial: ["'Cinzel'", "Georgia", "serif"],
        serif: ["'Newsreader'", "Georgia", "serif"],
        formula: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.6" }],
        base: ["1rem", { lineHeight: "1.65" }],
        lg: ["1.125rem", { lineHeight: "1.65" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.4" }],
        "3xl": ["1.875rem", { lineHeight: "1.3" }],
        "4xl": ["2.25rem", { lineHeight: "1.25" }],
        "5xl": ["3rem", { lineHeight: "1.2" }],
        "6xl": ["3.75rem", { lineHeight: "1.15" }],
      },
      boxShadow: {
        quiet: "0 1px 3px rgba(24, 25, 27, 0.04), 0 1px 2px rgba(24, 25, 27, 0.02)",
        editorial: "0 10px 30px -10px rgba(24, 25, 27, 0.06)",
        lift: "0 16px 36px -12px rgba(24, 25, 27, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
