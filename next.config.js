/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false, // enable browser source map generation during the production build
  // Configure pageExtensions to include md and mdx
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    // appDir: true,
  },
  // Configure images for external domains
  images: {
    unoptimized: true, // Disable image optimization globally
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dify.ai',
        port: '',
        pathname: '/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dify.ai',
        port: '',
        pathname: '/files/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.railway.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // fix all before production. Now it slow the develop speed.
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // https://nextjs.org/docs/api-reference/next.config.js/ignoring-typescript-errors
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
