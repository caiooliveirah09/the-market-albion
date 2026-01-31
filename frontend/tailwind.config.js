/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tier: {
          2: '#808080',
          3: '#6b8e23',
          4: '#4169e1',
          5: '#9370db',
          6: '#ff8c00',
          7: '#ffd700',
          8: '#ff1493'
        },
        quality: {
          1: '#9ca3af', // gray
          2: '#22c55e', // green
          3: '#3b82f6', // blue
          4: '#a855f7', // purple
          5: '#eab308'  // yellow/gold
        }
      }
    },
  },
  plugins: [],
}
