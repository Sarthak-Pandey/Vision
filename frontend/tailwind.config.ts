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
        background: "#FFFFFF",
        "secondary-bg": "#F7F7F6",
        card: "#FFFFFF",
        border: "#E7E7E5",
        "primary-text": "#1F1F1F",
        "secondary-text": "#6B6B6B",
        "muted-text": "#9A9A9A",
        brand: {
          primary: "#059669",
          "primary-hover": "#047857",
          "primary-light": "#ECFDF5",
          orange: "#F97316",
          "dark-orange": "#EA580C",
          "light-orange": "#FFF7ED",
        },
        status: {
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
