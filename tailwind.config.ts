import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xl': '1200px',
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        teal: {
          605: "#0d9488",
          650: "#0f766e",
          655: "#0f766e",
        },
        blue: {
          650: "#1d4ed8",
        },
        indigo: {
          650: "#4338ca",
        },
        slate: {
          250: "#cbd5e1",
          350: "#94a3b8",
          650: "#475569",
          655: "#334155",
        },
        rose: {
          650: "#be123c",
        },
        red: {
          650: "#b91c1c",
        },
        purple: {
          650: "#7e22ce",
        },
        emerald: {
          650: "#047857",
        },
      },
    },
  },
  plugins: [],
};
export default config;
