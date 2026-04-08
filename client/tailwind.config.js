/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#f5efff',
          100: '#ebddff',
          200: '#d8b8ff',
          300: '#bf88ff',
          400: '#a154ff',
          500: '#8930ff',
          600: '#7032f1',
          700: '#5b2bc6',
          800: '#4b269d',
          900: '#311f61'
        },
        accent: {
          50: '#ecfdff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490'
        },
        slatebg: '#f9fafb',
        navydark: '#0f172a'
      },
      boxShadow: {
        soft: '0 24px 80px -28px rgba(76, 38, 157, 0.28)',
        glow: '0 0 0 1px rgba(137, 48, 255, 0.08), 0 24px 60px -24px rgba(34, 211, 238, 0.28)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        popIn: 'popIn 0.2s ease-out'
      }
    }
  },
  plugins: []
};
