import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      screens: {
        'xs': '320px',   // small phones (iPhone SE)
        'sm': '390px',   // standard phones (iPhone 14)
        'md': '768px',   // tablets portrait
        'lg': '1024px',  // tablets landscape / laptop
        'xl': '1280px',  // desktop
        '2xl': '1536px', // large desktop / 4K
      },
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          50: "#EDE9FE",
          100: "#DDD6FE",
          200: "#C4B5FD",
          300: "#A78BFA",
          400: "#8B5CF6",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#2E1065",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        accent: {
          DEFAULT: "#A78BFA",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        success: "#059669",
        warning: "#F59E0B",
        danger: "#EF4444",
        healthbg: "#F8FAFC",
        textprimary: "#111827",
        textsecondary: "#6B7280",
        background: "var(--background)",
        foreground: "var(--foreground)",
        glass: {
          white: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.15)",
          light: "rgba(255, 255, 255, 0.65)",
          card: "rgba(255, 255, 255, 0.72)",
          dark: "rgba(15, 23, 42, 0.8)",
        },
        violet: {
          55: "#f5f3ff",
          605: "#7C3AED",
          650: "#6D28D9",
          750: "#5B21B6",
          850: "#3B0764",
        },
        teal: {
          605: "#7C3AED",
          650: "#5B21B6",
          655: "#5B21B6",
        },
        blue: {
          650: "#1d4ed8",
        },
        indigo: {
          650: "#4338ca",
        },
        gray: {
          150: "#ECEEF1",
          450: "#9CA3AF",
        },
        slate: {
          55: "#f8fafc",
          150: "#e9ecef",
          205: "#e2e8f0",
          250: "#cbd5e1",
          350: "#94a3b8",
          405: "#8b95a5",
          550: "#5a6577",
          650: "#475569",
          655: "#334155",
          705: "#374151",
          750: "#1e293b",
        },
        rose: {
          650: "#be123c",
        },
        red: {
          650: "#b91c1c",
          750: "#991b1b",
        },
        purple: {
          650: "#7e22ce",
          750: "#6b21a8",
        },
        amber: {
          55: "#fffbeb",
          250: "#fde68a",
          505: "#f59e0b",
          655: "#b45309",
          805: "#78350f",
        },
        sky: {
          850: "#075985",
        },
        emerald: {
          605: "#059669",
          650: "#047857",
        },
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 60px -15px rgba(79, 70, 229, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.12)',
        'glass-inset': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
        'accent-glow': '0 0 40px -10px rgba(0, 213, 165, 0.4)',
        'primary-glow': '0 0 40px -10px rgba(79, 70, 229, 0.4)',
        'neu': '6px 6px 12px rgba(0, 0, 0, 0.06), -6px -6px 12px rgba(255, 255, 255, 0.8)',
        'neu-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.05), inset -4px -4px 8px rgba(255, 255, 255, 0.7)',
        'neu-btn': '4px 4px 10px rgba(0, 0, 0, 0.08), -4px -4px 10px rgba(255, 255, 255, 0.9)',
        'neu-btn-active': 'inset 3px 3px 6px rgba(0, 0, 0, 0.06), inset -3px -3px 6px rgba(255, 255, 255, 0.8)',
        'float': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 30px 60px -15px rgba(79, 70, 229, 0.12), 0 15px 25px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-lg': '30px',
        'glass-xl': '40px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
        'blur-in': 'blurIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'ripple': 'ripple 0.6s ease-out',
        'lift': 'lift 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.15)' },
          '100%': { boxShadow: '0 0 40px rgba(79, 70, 229, 0.3)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        lift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
