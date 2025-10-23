import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // We'll handle ESLint separately
  },
  typescript: {
    ignoreBuildErrors: false, // Keep type checking during build
  },
};

export default nextConfig;
