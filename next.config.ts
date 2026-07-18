import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Optional: only needed if SCHEMA_PUSH_AT_RUNTIME=1 on Vercel.
  outputFileTracingIncludes: {
    "/api/cron/setup": [
      "./prisma/**/*",
      "./prisma.config.ts",
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/**/*",
    ],
  },
  serverExternalPackages: [
    "prisma",
    "@prisma/client",
    "@prisma/engines",
    "@prisma/debug",
    "pg",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      {
        protocol: "https",
        hostname: "**.ssl-images-amazon.com",
      },
    ],
  },
  async redirects() {
    return [
      // Convenience: /de/cron/... and /cron/... → /api/cron/...
      {
        source: "/cron/:path*",
        destination: "/api/cron/:path*",
        permanent: false,
      },
      {
        source: "/:locale(de|en)/cron/:path*",
        destination: "/api/cron/:path*",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
