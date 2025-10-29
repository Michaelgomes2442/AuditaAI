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
      // Ensure frontend NextAuth routes are handled locally first
      // (avoid proxying /api/auth/* to the backend which causes 404 on NextAuth callbacks)
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Proxy backend-only auth endpoints under /backend-api/auth/* if needed
      // (keep generic proxy for other API routes below)
      // Proxy all other API routes to backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;