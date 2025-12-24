/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mate-cream': '#DCD7C9',
        'mate-brown': '#A27B5C',
        'mate-forest': '#3F4F44',
        'mate-dark': '#2C3930',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
