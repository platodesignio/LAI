import { db } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

// In-memory cache for feature flags to reduce DB calls within a single request.
// This is a module-level cache that persists across requests in the same process instance.
// For Vercel serverless, this will be per-instance, which is acceptable.
let cache: Map<string, boolean> | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export async function getFeatureFlag(key: string): Promise<boolean> {
  const now = Date.now();

  if (cache && now < cacheExpiry) {
    return cache.get(key) ?? false;
  }

  try {
    const flags = await db.featureFlag.findMany({
      select: { key: true, enabled: true },
    });
    cache = new Map(flags.map((f) => [f.key, f.enabled]));
    cacheExpiry = now + CACHE_TTL_MS;
    return cache.get(key) ?? false;
  } catch (err) {
    logger.error("Failed to load feature flags", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function getFeatureFlagWithMetadata(
  key: string
): Promise<{ enabled: boolean; metadata: Record<string, unknown> | null }> {
  try {
    const flag = await db.featureFlag.findUnique({ where: { key } });
    if (!flag) return { enabled: false, metadata: null };
    return {
      enabled: flag.enabled,
      metadata: flag.metadata as Record<string, unknown> | null,
    };
  } catch {
    return { enabled: false, metadata: null };
  }
}

/**
 * Check if rate limiting is enabled (can be disabled in dev).
 */
export async function isRateLimitingEnabled(): Promise<boolean> {
  return getFeatureFlag("rate_limiting_enabled");
}

/**
 * Check if chat is enabled.
 */
export async function isChatEnabled(): Promise<boolean> {
  return getFeatureFlag("chat_enabled");
}

/**
 * Check if new user registration is enabled.
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  return getFeatureFlag("registration_enabled");
}

/**
 * Get the active AI provider — may be overridden via feature flag.
 * Falls back to AI_PROVIDER env var.
 */
export async function getActiveAIProvider(): Promise<"anthropic" | "openai"> {
  const override = await getFeatureFlagWithMetadata("chat_provider_override");
  if (override.enabled && override.metadata?.["provider"]) {
    const p = override.metadata["provider"];
    if (p === "anthropic" || p === "openai") return p;
  }
  const envProvider = process.env["AI_PROVIDER"] ?? "anthropic";
  return envProvider === "openai" ? "openai" : "anthropic";
}

/**
 * Invalidate the feature flag cache. Call after admin updates a flag.
 */
export function invalidateFeatureFlagCache(): void {
  cache = null;
  cacheExpiry = 0;
}
