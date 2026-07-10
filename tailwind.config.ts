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
        primary: "#4F46E5",
        secondary: "#6D5EF9",
        accent: "#00D5A5",
        healthbg: "#F7F9FC",
        textprimary: "#111827",
        textsecondary: "#6B7280",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
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
          605: "#059669",
          650: "#047857",
        },
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 40px -15px rgba(79, 70, 229, 0.08)',
        'accent-shadow': '0 12px 24px -10px rgba(0, 213, 165, 0.3)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
