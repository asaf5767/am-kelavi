/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'calm-blue': '#3B82F6',
        'calm-green': '#10B981',
        'calm-purple': '#8B5CF6',
        'calm-orange': '#F59E0B',
        'calm-red': '#EF4444',
        'calm-gray': '#6B7280'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}