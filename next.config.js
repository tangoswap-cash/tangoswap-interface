const withPWA = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

const linguiConfig = require('./lingui.config.js')

const { locales, sourceLocale } = linguiConfig

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})


const nextConfig = {
  webpack: (config) => {
    config.module.rules = [
      ...config.module.rules,
      {
        resourceQuery: /raw-lingui/,
        type: 'javascript/auto',
      },
    ]

    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        tls: false,
        net: false,
        fs: false,
      }
    }

    return config
  },
  experimental: { esmExternals: true },
  pwa: {
    dest: 'public',
    runtimeCaching,
    disable: process.env.NODE_ENV === 'development',
  },
  images: {
    domains: [
      'raw.githubusercontent.com',
      'metadata.bch.domains',
    ],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/smart-swap',
        permanent: true,
      },
      {
        source: '/',
        destination: '/limit-order',
        permanent: true,
      },
      {
        source: '/yield',
        destination: '/farm',
        permanent: true,
      },
      // Analytics
      {
        source: '/analytics',
        destination: '/analytics/dashboard',
        permanent: true,
      },
      {
        source: '/portfolio',
        destination: '/analytics/portfolio',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/stake',
        destination: '/bar',
      },
      {
        source: '/add/:token*',
        destination: '/exchange/add/:token*',
      },
      {
        source: '/remove/:token*',
        destination: '/exchange/remove/:token*',
      },
      {
        source: '/create/:token*',
        destination: '/exchange/add/:token*',
      },
      {
        source: '/swap',
        destination: '/exchange/swap',
      },
      {
        source: '/swap/:token*',
        destination: '/exchange/swap/:token*',
      },
      {
        source: '/smart-swap',
        destination: '/exchange/smart-swap',
      },
      {
        source: '/smart-swap/:token*',
        destination: '/exchange/smart-swap/:token*',
      },
      {
        source: '/limit-order/:token*',
        destination: '/exchange/limit-order/:token*',
      },
      {
        source: '/pool',
        destination: '/exchange/pool',
      },
      {
        source: '/find',
        destination: '/exchange/find',
      },
      {
        source: '/gridex',
        destination: '/gridex/gridex-list'
      }
    ]
  },
  i18n: {
    localeDetection: true,
    locales,
    defaultLocale: sourceLocale,
  },
}

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withBundleAnalyzer(nextConfig)

// Don't delete this console log, useful to see the config in Vercel deployments
console.log('next.config.js', JSON.stringify(module.exports, null, 2))
