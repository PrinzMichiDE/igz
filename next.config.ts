import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Keep Prisma schema/CLI available to the setup cron on Vercel serverless.
  outputFileTracingIncludes: {
    "/api/cron/setup": [
      "./prisma/**/*",
      "./prisma.config.ts",
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/engines/**/*",
      "./node_modules/@prisma/config/**/*",
    ],
  },
  serverExternalPackages: ["prisma", "@prisma/client", "@prisma/engines", "pg"],
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
