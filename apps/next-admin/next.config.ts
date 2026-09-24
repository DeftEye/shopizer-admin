import type { NextConfig } from "next";

const shopizerApiUrl = (
  process.env.SHOPIZER_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/shopizer-api/:path*",
        destination: `${shopizerApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
