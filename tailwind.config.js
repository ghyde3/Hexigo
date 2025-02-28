/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Catan resource colors
        'desert': '#e9d8a6',
        'ore': '#9c9c9c',
        'wood': '#588157',
        'brick': '#bc6c25',
        'sheep': '#a7c957',
        'wheat': '#ffb703'
      },
    },
  },
  plugins: [],
} 