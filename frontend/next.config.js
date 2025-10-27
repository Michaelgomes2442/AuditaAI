import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: join(__dirname, '../'),
  eslint: {
    ignoreDuringBuilds: true, // We'll handle ESLint separately
  },
  typescript: {
    ignoreBuildErrors: false, // Keep type checking during build
  },
};

export default nextConfig;