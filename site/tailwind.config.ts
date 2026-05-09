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
        background: "#0b0f19",
        panel: "#101624",
        panelSoft: "#151d2e",
        border: "#253044",
        muted: "#94a3b8",
        discord: "#5865f2",
        success: "#34d399",
        warning: "#f59e0b",
        danger: "#fb7185",
        gold: "#f8c14a"
      },
      boxShadow: {
        glow: "0 0 45px rgba(88, 101, 242, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
