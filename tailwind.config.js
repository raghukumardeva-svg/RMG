/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Status badge colors - ensures JIT compiler includes these
    'bg-blue-500', 'text-white',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-red-500',
    'bg-slate-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-cyan-500',
  ],
  theme: {
    extend: {
      // Inter Font Family - Brand Typography
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Brand Color Palette
      colors: {
        // Legacy CSS Variables (for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Brand Colors - Primary Palette
        brand: {
          green: '#0E9F6E',        // Primary actions, success
          'green-dark': '#0A7C55',  // Hover state
          'green-light': '#D1FAE5', // Light backgrounds
          navy: '#1C242E',          // Headings, titles
          slate: '#6B7280',         // Secondary text, icons
          'light-gray': '#E5E7EB',  // Borders, dividers
          'off-white': '#F9FAFB',   // Page backgrounds
        },
        
        // Primary color mapped to brand green
        primary: {
          DEFAULT: "#0E9F6E",
          foreground: "#FFFFFF",
          dark: "#0A7C55",
          light: "#D1FAE5",
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
      // Consistent Spacing Scale
      spacing: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      // Minimal Border Radius
      borderRadius: {
        lg: "0.5rem",   // 8px
        md: "0.375rem", // 6px
        sm: "0.25rem",  // 4px
      },
      // Typography Line Heights
      lineHeight: {
        'comfortable': '1.6',
        'relaxed': '1.75',
      },
    },
  },
  plugins: [],
}
