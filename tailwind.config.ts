import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors (Violet)
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',  // Primary
          600: '#7c3aed',  // Darker
          700: '#6d28d9',  // Even Darker
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Accent Colors (Amber/Yellow)
        accent: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Primary Accent
          600: '#d97706',
          700: '#b45309',
        },
        // Royal Theme Colors
        royal: {
          dark: '#0f0c29',
          mid: '#302b63',
          light: '#24243e',
          gold: '#FFD700',
          goldLight: '#FDB931',
        },
        gold: {
          100: '#fff9c4',
          200: '#fff59d',
          300: '#fff176',
          400: '#ffee58',
          500: '#ffeb3b',
          600: '#fdd835',
          700: '#fbc02d',
          800: '#f9a825',
          900: '#f57f17',
          gradient: 'linear-gradient(135deg, #FDB931 0%, #9f7928 100%)', // Pseudo usage
        },
        // Surface Colors
        surface: {
          light: '#ffffff',
          off: '#f8fafc',      // Light gray background
          dark: '#191022',     // Dark theme bg
          darker: '#1e1b4b',   // Indigo-900 for result screen
          card: '#2a2442',     // Dark card background
        },
        // Text Colors
        text: {
          main: '#1e293b',     // Slate 800
          sub: '#64748b',      // Slate 500
          muted: '#94a3b8',    // Slate 400
          light: '#cbd5e1',    // Slate 300
          white: '#ffffff',
        },
        // Status Colors
        status: {
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6',
        },
        // Physics Wallah Inspired Colors
        pw: {
          violet: '#140D52',      // Deep Violet - Primary
          indigo: '#4437B8',      // Governor Bay - Secondary
          lavender: '#ABA3EC',    // Biloba Flower - Accent
          red: '#B03B32',         // Medium Carmine - CTA/Alert
          surface: '#F8F9FC',     // Light Background
          card: '#FFFFFF',        // White Cards
          border: '#E5E7EB',      // Light Gray Border
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        display: ['var(--font-space)', 'sans-serif'],
        body: ['var(--font-noto)', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 20px 40px -15px rgba(124, 58, 237, 0.15)',
        'glow': '0 0 25px rgba(139, 92, 246, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'deep': '0 20px 60px -20px rgba(0, 0, 0, 0.2)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'dark-card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        // PW-style shadows (cleaner, softer)
        'pw-sm': '0 2px 8px rgba(20, 13, 82, 0.08)',
        'pw-md': '0 4px 16px rgba(20, 13, 82, 0.1)',
        'pw-lg': '0 8px 24px rgba(20, 13, 82, 0.12)',
        'pw-xl': '0 12px 32px rgba(20, 13, 82, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-light': 'bounce-light 1s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-light': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
