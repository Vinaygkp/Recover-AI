/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface colors
        surface: {
          50: '#fafafa',
          100: '#0c0c0e',
          200: '#121216',
          300: '#1a1a20',
          400: '#22222a',
          500: '#2a2a35',
        },
        // Accent colors
        accent: {
          green: '#00D26A',
          amber: '#FFB020',
          red: '#FF4C4C',
          blue: '#3B82F6',
          purple: '#9333ea',
          cyan: '#06b6d4',
        },
        // Brand
        recover: {
          primary: '#00D26A',
          secondary: '#0EA5E9',
        },
        // Semantic background colors
        bg: {
          primary: '#000000',
          secondary: '#0c0c0e',
          card: '#121216',
          elevated: '#1a1a20',
        },
        // Semantic text colors
        text: {
          primary: '#ffffff',
          secondary: '#a0a0ab',
          muted: '#666670',
        },
        // Semantic border colors
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        fadeIn: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUp: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spinSlow: 'spinSlow 12s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}