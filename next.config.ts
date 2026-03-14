import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress ESLint during `next build` — run lint separately in CI.
  // This prevents ESLint rule differences between versions from breaking deploys.
  eslint: {
    ignoreDuringBuilds: true,
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
  // Ensure Prisma and bcrypt work in serverless environments (no bundling).
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  // Image optimization — no remote patterns needed for now.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
