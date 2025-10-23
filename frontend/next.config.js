/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  eslint: {
    ignoreDuringBuilds: true, // We'll handle ESLint separately
  },
  typescript: {
    ignoreBuildErrors: false, // Keep type checking during build
  },
};

module.exports = nextConfig;