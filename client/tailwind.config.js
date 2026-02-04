/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kahoot-purple': '#4C76C7', // NST Primary
        'kahoot-red': '#e21b3c',
        'kahoot-blue': '#1368ce',
        'kahoot-yellow': '#ffa602',
        'kahoot-green': '#26890c',
        'nst-dark': '#1a2b4b',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
