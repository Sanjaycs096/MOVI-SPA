/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1F4D3E',
        accent: '#2F7D6D',
        soft: '#F5F3EF',
        card: '#FFFFFF',
        muted: '#6B7280',
        heading: '#1A1A1A',
        gold: '#C8A97E',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
