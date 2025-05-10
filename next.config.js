/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME,
    NEXT_PUBLIC_SERPAPI_API_KEY: process.env.NEXT_PUBLIC_SERPAPI_API_KEY || process.env.SERPAPI_API_KEY,
    NEXT_PUBLIC_NOTDIAMOND_API_KEY: process.env.NEXT_PUBLIC_NOTDIAMOND_API_KEY || process.env.NOTDIAMOND_API_KEY,
  },
  // ESLint configuration to avoid deployment issues
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  // Configuration des origines autorisées via les en-têtes HTTP
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://192.168.56.1',
          },
        ],
      },
    ];
  },
  // Configuration webpack pour la compatibilité des modules
  webpack: (config, { isServer }) => {
    // Ajustements spécifiques pour la gestion des modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // Configure Turbopack (moved from experimental.turbo as it's now stable)
  turbopack: {
    // Turbopack configuration options go here
  }
}

module.exports = nextConfig;