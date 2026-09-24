import type { NextConfig } from "next";

// Origin includes the Angular `apiUrl` suffix (`/api`). Do not strip `/v1`.
const shopizerApiOrigin =
  process.env.SHOPIZER_API_URL ?? "http://localhost:8080/api";
const shippingApiOrigin =
  process.env.SHOPIZER_SHIPPING_API_URL ??
  "http://localhost:9090/shipping/api/v1";
const shopizerHost = shopizerApiOrigin.replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${shopizerApiOrigin}/:path*`,
      },
      {
        source: "/shipping-api/:path*",
        destination: `${shippingApiOrigin}/:path*`,
      },
      {
        source: "/actuator/:path*",
        destination: `${shopizerHost}/actuator/:path*`,
      },
    ];
  },
};

export default nextConfig;
