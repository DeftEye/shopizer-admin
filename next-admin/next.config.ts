import type { NextConfig } from "next";

/**
 * Shopizer Spring Boot API base, same default as Angular
 * `src/environments/environment.ts` (`http://localhost:8080/api`).
 *
 * Browser calls stay same-origin (`/shopizer-api/...`) so CORS is not required
 * during local development — same idea as Angular `proxy.conf.json`.
 */
const shopizerApiUrl =
  process.env.SHOPIZER_API_URL ?? "http://localhost:8080/api";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/shopizer-api/:path*",
        destination: `${shopizerApiUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
