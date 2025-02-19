/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.dl.dropboxusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'beforest.co',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig; 