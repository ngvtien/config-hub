/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "Andale Mono",
          "Ubuntu Mono",
          "monospace",
        ],
        display: [
          "Cal Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        // Refined type scale - slightly smaller for sharper, denser UI
        'xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],      // 11px
        'sm': ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],   // 13px
        'base': ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0' }],        // 15px
        'lg': ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '-0.025em' }], // 17px
        'xl': ['1.1875rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],  // 19px
        '2xl': ['1.375rem', { lineHeight: '1.875rem', letterSpacing: '-0.025em' }], // 22px
        '3xl': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.025em' }],  // 28px
        '4xl': ['2.125rem', { lineHeight: '2.375rem', letterSpacing: '-0.025em' }], // 34px
        '5xl': ['2.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],         // 44px
        '6xl': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],          // 56px
        '7xl': ['4.25rem', { lineHeight: '1', letterSpacing: '-0.025em' }],         // 68px
        '8xl': ['5.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],          // 88px
        '9xl': ['7.5rem', { lineHeight: '1', letterSpacing: '-0.025em' }],          // 120px
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}