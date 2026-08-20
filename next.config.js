/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // 🔒 CSP reforçado:
            // - Removido unsafe-eval (não necessário em Next.js produção)
            // - Removido wehostinc.onrender.com (não utilizado)
            // - Adicionado frame-ancestors para prevenir clickjacking
            // - connect-src restrito ao próprio domínio e APIs necessárias
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob: https://res.cloudinary.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.resend.com https://ipapi.co https://wehosthere.com https://res.cloudinary.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com",
              "frame-src https://accounts.google.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig

