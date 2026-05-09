import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b0d",
        panel: "#12181a",
        panelSoft: "#192225",
        border: "#2c3739",
        muted: "#9aa7a7",
        discord: "#d71935",
        success: "#34d399",
        warning: "#f59e0b",
        danger: "#fb7185",
        gold: "#d8f3f0"
      },
      boxShadow: {
        glow: "0 28px 90px rgba(215, 25, 53, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
