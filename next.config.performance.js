/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Enable production source maps for debugging
  productionBrowserSourceMaps: true,

  // Configure pageExtensions to include md and mdx
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Performance optimizations
  experimental: {
    // Enable modern JavaScript features
    esmExternals: true,

    // Enable SWC minifier for better performance
    swcMinify: true,

    // Enable concurrent features
    serverComponentsExternalPackages: ['canvas'],

    // Optimize CSS imports
    optimizeCss: true,

    // Enable app directory
    appDir: true,
  },

  // Image optimization settings
  images: {
    // Re-enable image optimization for performance
    unoptimized: false,

    // Configure image formats for better compression
    formats: ['image/webp', 'image/avif'],

    // Image quality settings
    quality: 85,

    // Configure image sizes for responsive loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Remote patterns for external images
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

  // Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new webpack.BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        }),
      )
    }

    // Tree shaking optimizations
    config.optimization = {
      ...config.optimization,

      // Enable tree shaking
      usedExports: true,
      sideEffects: false,

      // Split chunks for better caching
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for stable dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },

          // Monaco Editor separate chunk (large dependency)
          monaco: {
            test: /[\\/]node_modules[\\/](@monaco-editor|monaco-editor)[\\/]/,
            name: 'monaco',
            chunks: 'all',
            priority: 30,
          },

          // ECharts separate chunk
          echarts: {
            test: /[\\/]node_modules[\\/](echarts|echarts-for-react)[\\/]/,
            name: 'echarts',
            chunks: 'all',
            priority: 25,
          },

          // ReactFlow separate chunk
          reactflow: {
            test: /[\\/]node_modules[\\/](reactflow|@reactflow)[\\/]/,
            name: 'reactflow',
            chunks: 'all',
            priority: 25,
          },

          // Lexical Editor separate chunk
          lexical: {
            test: /[\\/]node_modules[\\/]@lexical[\\/]/,
            name: 'lexical',
            chunks: 'all',
            priority: 25,
          },

          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    }

    // Externalize heavy dependencies for CDN loading
    if (!isServer) {
      config.externals = {
        ...config.externals,
        // Externalize Monaco Editor to CDN
        'monaco-editor': 'var monaco',
      }
    }

    // Optimize lodash imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^lodash$/,
        'lodash-es',
      ),
    )

    // Alias optimizations for smaller bundles
    config.resolve.alias = {
      ...config.resolve.alias,

      // Use ES modules for better tree shaking
      'lodash': 'lodash-es',

      // Optimize React imports
      'react': 'react/index.js',
      'react-dom': 'react-dom/index.js',
    }

    // Module federation for micro-frontends (future)
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.container.ModuleFederationPlugin({
          name: 'chat_app',
          filename: 'remoteEntry.js',
          exposes: {
            './Chat': './app/components/chat',
            './ConversationList': './app/components/conversation-list',
          },
          shared: {
            'react': { singleton: true, eager: true },
            'react-dom': { singleton: true, eager: true },
          },
        }),
      )
    }

    // Performance budgets
    config.performance = {
      maxAssetSize: 500000, // 500KB
      maxEntrypointSize: 500000, // 500KB
      hints: dev ? false : 'warning',
    }

    return config
  },

  // Compression and headers
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },

  // Redirects for performance
  async redirects() {
    return [
      // Redirect old URLs to maintain SEO
      {
        source: '/chat/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ]
  },

  // Rewrites for API optimization
  async rewrites() {
    return [
      // API routes optimization
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },

  // Output optimizations
  output: 'standalone',

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable strict mode for better performance
    reactStrictMode: true,

    // Enable SWC minification
    swcMinify: true,

    // Disable source maps in production (override for debugging)
    productionBrowserSourceMaps: false,
  }),

  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Fast refresh for better DX
    reactStrictMode: false,

    // Enable source maps in development
    productionBrowserSourceMaps: true,
  }),

  // ESLint and TypeScript - enable for production
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
    dirs: ['app', 'components', 'service', 'hooks', 'utils', 'types'],
  },

  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production'
      ? {
        exclude: ['error', 'warn'],
      }
      : false,

    // Styled-components support
    styledComponents: false,

    // React compiler optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production'
      ? {
        properties: ['^data-testid$'],
      }
      : false,
  },
}

module.exports = withBundleAnalyzer(nextConfig)
