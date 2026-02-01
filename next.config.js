/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn-icons-png.flaticon.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'viqllwnggbohvydtnxcv.supabase.co',
      'i.ytimg.com',
      'yt3.ggpht.com'
    ],
  },
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
