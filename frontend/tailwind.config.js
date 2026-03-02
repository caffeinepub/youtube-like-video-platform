/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand crimson-red accent
        "mt-red": {
          50:  "oklch(0.95 0.05 18)",
          100: "oklch(0.90 0.08 18)",
          200: "oklch(0.80 0.12 18)",
          300: "oklch(0.70 0.16 18)",
          400: "oklch(0.62 0.20 18)",
          500: "oklch(0.55 0.22 18)",
          600: "oklch(0.48 0.22 18)",
          700: "oklch(0.40 0.20 18)",
          800: "oklch(0.32 0.16 18)",
          900: "oklch(0.22 0.10 18)",
        },
        // Charcoal base
        "mt-charcoal": {
          50:  "oklch(0.95 0.005 240)",
          100: "oklch(0.88 0.008 240)",
          200: "oklch(0.75 0.010 240)",
          300: "oklch(0.60 0.010 240)",
          400: "oklch(0.45 0.010 240)",
          500: "oklch(0.35 0.010 240)",
          600: "oklch(0.28 0.010 240)",
          700: "oklch(0.22 0.010 240)",
          800: "oklch(0.16 0.010 240)",
          900: "oklch(0.12 0.008 240)",
          950: "oklch(0.08 0.006 240)",
        },
        // Admin panel colors
        "admin-bg": "var(--admin-bg)",
        "admin-sidebar": "var(--admin-sidebar)",
        "admin-card": "var(--admin-card)",
        "admin-header": "var(--admin-header)",
        "admin-border": "var(--admin-border)",
        "admin-text": "var(--admin-text)",
        "admin-muted": "var(--admin-muted)",
        "admin-teal": "var(--admin-teal)",
        "admin-violet": "var(--admin-violet)",
        // Legacy brand tokens (kept for compatibility)
        "mt-magenta": "oklch(0.55 0.22 18)",
        "mt-pink": "oklch(0.65 0.18 20)",
        "mt-purple": "oklch(0.55 0.18 290)",
        "mt-blue": "oklch(0.55 0.16 240)",
        "mt-cyan": "oklch(0.65 0.14 200)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        "glow-red": "0 0 20px oklch(0.55 0.22 18 / 0.4)",
        "glow-red-sm": "0 0 10px oklch(0.55 0.22 18 / 0.3)",
        "glow-red-lg": "0 0 40px oklch(0.55 0.22 18 / 0.5)",
        "card": "0 2px 8px oklch(0 0 0 / 0.4)",
        "card-hover": "0 8px 24px oklch(0 0 0 / 0.5)",
        "inner-glow": "inset 0 1px 0 oklch(1 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px oklch(0.55 0.22 18 / 0.3)" },
          "50%": { boxShadow: "0 0 25px oklch(0.55 0.22 18 / 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
