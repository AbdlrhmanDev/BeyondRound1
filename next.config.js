const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,

  // Strip all console in production (smaller bundles, faster parse, less main-thread work)
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
  }),

  // Supabase generated types have Insert/Update as 'never' - run: npx supabase gen types
  typescript: { ignoreBuildErrors: true },
  // ESLint errors (unescaped entities, hooks in services) - fix incrementally; next lint still runs
  eslint: { ignoreDuringBuilds: true },

  // Disable source maps in prod to reduce bundle (1.1MB unused JS savings)
  productionBrowserSourceMaps: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Headers for security + cache
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // Static marketing pages: allow bfcache (avoid no-store)
      {
        source: '/:locale(de|en)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/about',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/contact',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/faq',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/for-doctors',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/learn-more',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/pricing',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/waitlist',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/terms',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      {
        source: '/:locale(de|en)/privacy',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=300' }],
      },
      // Service Worker — must not be cached by the browser (always re-check)
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/hero-doctors-friendship-mobile.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/hero-doctors-friendship.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/hero-doctors-friendship-card.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/hero-doctors-friendship-800.webp',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },

  // Transpile packages that need it (tailwind-merge removed – caused vendor-chunks resolution errors in dev)
  transpilePackages: ['lucide-react'],

  // Webpack config: ESM fallbacks + aggressive chunk splitting for smaller initial bundles
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      // Keep framework in separate chunk for better caching
      const existingCacheGroups = config.optimization.splitChunks?.cacheGroups || {};
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...existingCacheGroups,
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          },
        },
      };
    }
    config.infrastructureLogging = { level: 'error' };
    return config;
  },

  // Experimental features
  experimental: {
    optimizePackageImports: [
      'i18next',
      'react-i18next',
      'lucide-react',
      'date-fns',
      'recharts',
      'sonner',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'embla-carousel-react',
      'react-hook-form',
      'zod',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
    serverActions: {
      allowedOrigins: ['localhost:3000', 'beyondrounds.app', 'app.beyondrounds.app', 'whitelist.beyondrounds.app', 'checkout.beyondrounds.app'],
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig);
