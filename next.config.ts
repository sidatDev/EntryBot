import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ... existing config ...
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit for file uploads
    },
  },
  output: "standalone",
};

export default nextConfig;
