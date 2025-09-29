/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        jungle: {
          50: '#f1f8f5',
          100: '#dfeee6',
          200: '#c0dccd',
          300: '#9cc2ae',
          400: '#6f9c82',
          500: '#4d7f65',
          600: '#3a6450',
          700: '#304f40',
          800: '#263c31',
          900: '#1b2b23'
        }
      }
    }
  },
  plugins: []
};
