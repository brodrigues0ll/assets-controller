const withPWA = require('@ducanh2912/next-pwa').default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3010'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
        port: '9000',
        pathname: '/infraledger/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        port: '9000',
        pathname: '/infraledger/**',
      },
    ],
  },
};

module.exports = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
