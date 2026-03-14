import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack(config) {
    // zod-to-json-schema@3.25+ imports 'zod/v3' (a zod 4 compat path).
    // We're on zod 3.x which has no such export, so alias it to the root zod.
    config.resolve.alias = {
      ...config.resolve.alias,
      "zod/v3": path.resolve("node_modules/zod"),
    };
    return config;
  },
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
  // Ensure these server-only packages are not bundled by webpack.
  // This also prevents webpack from following @ai-sdk/ui-utils → zod-to-json-schema
  // → zod/v3 import chain (zod/v3 only exists in zod 4, not zod 3.x).
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "ai",
    "@ai-sdk/anthropic",
    "@ai-sdk/openai",
    "@ai-sdk/provider",
    "@ai-sdk/ui-utils",
  ],
  // Image optimization — no remote patterns needed for now.
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
