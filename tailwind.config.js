/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fff5f5',
          100: '#ffe0e0',
          200: '#ffbdbd',
          500: '#C62828',
          600: '#b71c1c',
          700: '#8B0000',
        },
        gold: {
          400: '#F9A825',
          500: '#F57F17',
        }
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease',
        'slide-up':   'slideUp 0.3s cubic-bezier(.22,.68,0,1.2)',
        'flip-front': 'flipFront 0.3s ease',
        'flip-back':  'flipBack 0.3s ease',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        flipFront: { from: { transform: 'rotateY(0deg)' },   to: { transform: 'rotateY(90deg)' } },
        flipBack:  { from: { transform: 'rotateY(-90deg)' }, to: { transform: 'rotateY(0deg)' } },
      },
    },
  },
  plugins: [],
}
