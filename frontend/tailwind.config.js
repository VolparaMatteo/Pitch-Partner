/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#85FF00',
          dark: '#70E000',
          light: '#9FFF33',
        },
      },
    },
  },
  plugins: [],
}
