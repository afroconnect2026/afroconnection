/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f4e6',
          100: '#b3e0b3',
          200: '#80cc80',
          300: '#4db84d',
          400: '#2ca42c',
          500: '#008000', // Main green from logo
          600: '#007300',
          700: '#006600',
          800: '#005900',
          900: '#004d00',
        },
        gold: {
          50: '#fff9e6',
          100: '#ffedb3',
          200: '#ffe180',
          300: '#ffd54d',
          400: '#ffcc26',
          500: '#FFC300', // Gold from logo
          600: '#e6b000',
          700: '#cc9d00',
          800: '#b38a00',
          900: '#997700',
        },
        navy: {
          50: '#e6e9f0',
          100: '#b3bdd9',
          200: '#8091c2',
          300: '#4d65ab',
          400: '#26469a',
          500: '#001F3F', // Navy blue from logo
          600: '#001c39',
          700: '#001832',
          800: '#00142c',
          900: '#001023',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
