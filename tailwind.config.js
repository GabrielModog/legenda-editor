/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#8b5cf6',
        'brand-hover': '#7c3aed',
        surface: '#1e1e2e',
        'surface-hover': '#2a2a3e',
        'border-custom': '#33334d',
        'diff-add': '#1a3a2a',
        'diff-del': '#3a1a1a',
        'diff-add-text': '#4ade80',
        'diff-del-text': '#f87171',
      },
    },
  },
  plugins: [],
}
