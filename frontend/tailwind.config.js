/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme palette inspired by n8n/IcePanel
        dark: {
          bg: '#1a1a1a',
          surface: '#242424',
          border: '#333333',
          hover: '#2a2a2a',
        },
        accent: {
          primary: '#3b82f6', // blue-500
          hover: '#2563eb',   // blue-600
        }
      },
    },
  },
  plugins: [],
}
