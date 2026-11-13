/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          50: '#fdf8f3',
          100: '#faf0e6',
          200: '#f3dcc9',
          300: '#e8c0a0',
          400: '#d99d70',
          500: '#c87d4a',
          600: '#b06338',
          700: '#8e4e2d',
          800: '#734029',
          900: '#5f3524',
          950: '#321910',
        },
        cream: {
          50: '#fefefc',
          100: '#fdfcf7',
          200: '#fbf7eb',
          300: '#f7f0d8',
          400: '#f1e6b8',
          500: '#ead790',
          600: '#e0c46a',
          700: '#c9a84e',
          800: '#a3853e',
          900: '#846c34',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}