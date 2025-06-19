/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'content.dropboxapi.com',
      'dl.dropboxusercontent.com',
      'www.dropbox.com'
    ],
  },
}

module.exports = nextConfig 