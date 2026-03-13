import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  // Security headers are applied in middleware.ts for granular control.
  // next.config level headers below serve as a fallback.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  // Ensure Prisma works in serverless environments
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Image optimization settings
  images: {
    remotePatterns: [],
  },
  // Output configuration for Vercel
  output: undefined, // Let Vercel handle this
};

export default nextConfig;
