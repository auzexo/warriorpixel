/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'cdn.discordapp.com',
      'avatars.githubusercontent.com',
    ],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
