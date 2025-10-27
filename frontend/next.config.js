import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: join(__dirname, '../'),
  typescript: {
    ignoreBuildErrors: false, // Keep type checking during build
  },
  async rewrites() {
    return [
      // Exclude NextAuth routes from proxy - they should be handled by Next.js
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Proxy all other API routes to backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;