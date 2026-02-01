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
          dark: '#0a0a0f',
          darker: '#070709',
          card: '#12121a',
        },
        accent: {
          default: '#8b5cf6',
          ff: '#3b82f6',
          mc: '#10b981',
        },
        currency: {
          gems: '#4EE2EC',
        },
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(to bottom, #000000 0%, #1a0033 50%, #4c1d95 100%)',
        'gradient-ff': 'linear-gradient(to bottom, #000000 0%, #1e3a8a 100%)',
        'gradient-mc': 'linear-gradient(to bottom, #000000 0%, #064e3b 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
