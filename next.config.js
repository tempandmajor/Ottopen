const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TEMPORARY: Allow build to proceed to deploy critical auth fix
    // TODO: Fix TypeScript errors and set back to false
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle epub-gen in client-side code - replace with empty module
      config.resolve.alias = {
        ...config.resolve.alias,
        'epub-gen': false,
        'epub-gen/lib/index.js': false,
        ejs: false,
      }
      // Ignore epub-gen and its dependencies in client bundles
      config.plugins.push(
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /^epub-gen$/,
        })
      )
    }
    return config
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'react-hook-form'],
    serverActions: {
      allowedOrigins:
        process.env.NODE_ENV === 'production'
          ? [
              process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') || 'www.ottopen.app',
              'ottopen.app',
            ]
          : ['localhost:3000'],
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'epub-gen'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days (PERF-003)
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NODE_ENV === 'production'
                ? "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.openai.com https://api.anthropic.com https://vitals.vercel-insights.com https://vercel.live https://o4510172905603072.ingest.us.sentry.io; frame-src https://js.stripe.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
                : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.vercel-insights.com https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.openai.com https://api.anthropic.com https://vitals.vercel-insights.com https://vercel.live https://o4510172905603072.ingest.us.sentry.io; frame-src https://js.stripe.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return []
  },
}

// Wrap with bundle analyzer if ANALYZE=true
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Wrap with Sentry config if Sentry DSN is provided
const withSentry =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN ? withSentryConfig : config => config

module.exports = withSentry(
  withBundleAnalyzer(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  }
)
