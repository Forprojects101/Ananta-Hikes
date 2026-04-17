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
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#145231",
        },
        secondary: {
          50: "#faf5f0",
          100: "#f5e6d3",
          200: "#e8d4b8",
          300: "#d4b5a0",
          400: "#b88a5c",
          500: "#92400e",
          600: "#78350f",
          700: "#5a2d0c",
          800: "#422006",
          900: "#3c1d0d",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
