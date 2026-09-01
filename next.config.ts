import type { NextConfig } from "next";

// Validation can opt into a separate build directory without touching a running dev server.
const validationDistDir = process.env.IKMI_NEXT_DIST_DIR;
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://blogger.googleusercontent.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' https://res.cloudinary.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://*.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Public upload forms accept a 10 MB document plus bounded text fields.
    // The action still validates MIME, extension, signature, and exact file size.
    // Keep the framework's default same-origin Origin/Host validation; do not
    // widen `allowedOrigins` because every browser mutation is first-party.
    serverActions: { bodySizeLimit: '11mb' },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // we can optionally ignore ts errors if needed but let's stick to eslint first
  },
  ...(validationDistDir ? { distDir: validationDistDir } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'blogger.googleusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/agenda',
        destination: '/kegiatan',
        permanent: true,
      },
      {
        source: '/event',
        destination: '/kegiatan',
        permanent: true,
      },
      {
        source: '/about',
        destination: '/tentang',
        permanent: true,
      },
      {
        source: '/event/:path*',
        destination: '/kegiatan',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Origin-Agent-Cluster', value: '?1' },
          { key: 'X-XSS-Protection', value: '0' },
          // HSTS: enforces HTTPS with 1-year max-age + subdomains (set after production HTTPS confirmed)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
};

export default nextConfig;
