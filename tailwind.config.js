/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'discord-dark': '#313338',
        'discord-darker': '#2b2d31',
        'discord-darkest': '#1e1f22',
        'discord-input': '#1e1f22',
        'discord-text': '#b5bac1',
        'discord-purple': '#5865f2',
        'discord-purple-dark': '#4752c4',
      },
    },
  },
  plugins: [],
}
