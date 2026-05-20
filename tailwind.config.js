/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkbg: '#0b0b0b',
        panelbg: '#141414',
        borderbg: '#222222',
        ytred: '#ff0033',
        ytreddark: '#b30022',
        lightgray: '#aaaaaa',
        brightwhite: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 30px rgb(0, 0, 0, 0.7)',
        glow: '0 0 15px rgba(255, 0, 51, 0.4)',
      }
    },
  },
  plugins: [],
}
