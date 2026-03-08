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
        'discord-darkest': '#0a0a0f',
        'discord-dark': '#16161d',
        'discord-darker': '#1e1e2e',
        'discord-gray': '#2a2a3a',
        'discord-text': '#b9bbbe',
        'discord-blurple': '#5865f2',
        'discord-purple': '#7c3aed',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
