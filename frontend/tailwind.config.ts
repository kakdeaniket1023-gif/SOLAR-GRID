import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./glass/**/*.{js,ts,jsx,tsx,mdx}",
    "./ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./motion/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        solar: {
          darkest: "#050B18", // Deep Navy main background
          dark: "#070E1C",
          card: "#0B1426",    // Navy/Black cards & containers
          elevated: "#111E38", // Elevated glass surfaces
          border: "rgba(255, 255, 255, 0.08)",
          borderLight: "rgba(255, 255, 255, 0.15)",
          borderGold: "rgba(255, 200, 61, 0.3)",
          borderAmber: "rgba(255, 159, 28, 0.3)",
          borderBlue: "rgba(59, 130, 246, 0.3)",
          gold: {
            DEFAULT: "#FFC83D", // Primary Solar Gold
            light: "#FDE047",
            hover: "#EAB308",
            dark: "#CA8A04",
            glow: "rgba(255, 200, 61, 0.28)",
          },
          amber: {
            DEFAULT: "#FF9F1C", // Secondary warm highlight
            light: "#FDBA74",
            hover: "#F97316",
            dark: "#EA580C",
            glow: "rgba(255, 159, 28, 0.28)",
          },
          blue: {
            DEFAULT: "#3B82F6", // Electric Blue subtle technical accent
            light: "#60A5FA",
            hover: "#2563EB",
            dark: "#1D4ED8",
            glow: "rgba(59, 130, 246, 0.25)",
          },
          emerald: {
            DEFAULT: "#FFC83D",
            light: "#FDE047",
            dark: "#EAB308",
            glow: "rgba(255, 200, 61, 0.28)",
          },
          cyan: {
            DEFAULT: "#3B82F6",
            light: "#60A5FA",
            dark: "#2563EB",
            glow: "rgba(59, 130, 246, 0.25)",
          },
          charcoal: "#0B1426",
          slate: "#94A3B8",
          muted: "#64748B",
          white: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "monospace"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "solar-radial": "radial-gradient(circle at 50% 0%, rgba(255, 200, 61, 0.12), transparent 70%)",
        "gold-radial": "radial-gradient(circle at 50% 0%, rgba(255, 200, 61, 0.16), transparent 70%)",
        "amber-radial": "radial-gradient(circle at 50% 0%, rgba(255, 159, 28, 0.14), transparent 70%)",
        "blue-radial": "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.12), transparent 70%)",
        "midnight-radial": "radial-gradient(circle at 50% 20%, rgba(15, 27, 51, 0.9) 0%, #050B18 100%)",
        "solar-grid": "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
        "gold-grid": "linear-gradient(to right, rgba(255, 200, 61, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 200, 61, 0.05) 1px, transparent 1px)",
        "blue-grid": "linear-gradient(to right, rgba(59, 130, 246, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        "solar-glow": "0 0 25px -5px rgba(255, 200, 61, 0.28)",
        "gold-glow": "0 0 25px -5px rgba(255, 200, 61, 0.3)",
        "amber-glow": "0 0 25px -5px rgba(255, 159, 28, 0.3)",
        "blue-glow": "0 0 25px -5px rgba(59, 130, 246, 0.25)",
        "card-glow": "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
        "glass-inner": "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        energyFlow: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "energy-flow": "energyFlow 2s linear infinite",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
