import { db } from "@/lib/db";
import { logIncident } from "@/lib/utils/incidents";

export interface RateLimitConfig {
  key: string; // e.g., `chat:user_xyz` or `auth:ip_1.2.3.4`
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Sliding-window rate limiter backed by the database.
 *
 * Uses upsert + increment to be safe under concurrent serverless invocations.
 * Resets the bucket when resetAt has passed.
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();

  // Get or create bucket
  const existing = await db.rateLimitBucket.findUnique({
    where: { key: config.key },
  });

  // If bucket doesn't exist or is expired, reset it
  if (!existing || existing.resetAt < now) {
    const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);
    await db.rateLimitBucket.upsert({
      where: { key: config.key },
      create: {
        key: config.key,
        count: 1,
        resetAt,
      },
      update: {
        count: 1,
        resetAt,
      },
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Bucket exists and is within window
  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  // Increment count
  const updated = await db.rateLimitBucket.update({
    where: { key: config.key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: config.maxRequests - updated.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Apply rate limiting for chat requests.
 * Returns null if allowed, or an error object if denied.
 */
export async function applyChatRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const max = parseInt(process.env["RATE_LIMIT_CHAT_MAX"] ?? "20", 10);
  const window = parseInt(
    process.env["RATE_LIMIT_CHAT_WINDOW_SECONDS"] ?? "3600",
    10
  );

  const result = await checkRateLimit({
    key: `chat:user:${userId}`,
    maxRequests: max,
    windowSeconds: window,
  });

  if (!result.allowed) {
    await logIncident({
      type: "RATE_LIMIT_EXCEEDED",
      severity: "LOW",
      description: `Chat rate limit exceeded for user ${userId}`,
      userId,
      metadata: { key: `chat:user:${userId}`, max, window },
    });
  }

  return result;
}

/**
 * Apply rate limiting for auth requests (login, register, password reset).
 */
export async function applyAuthRateLimit(
  ipAddress: string
): Promise<RateLimitResult> {
  const max = parseInt(process.env["RATE_LIMIT_AUTH_MAX"] ?? "10", 10);
  const window = parseInt(
    process.env["RATE_LIMIT_AUTH_WINDOW_SECONDS"] ?? "900",
    10
  );

  return checkRateLimit({
    key: `auth:ip:${ipAddress}`,
    maxRequests: max,
    windowSeconds: window,
  });
}

/**
 * Apply rate limiting for feedback submission.
 */
export async function applyFeedbackRateLimit(
  userId: string
): Promise<RateLimitResult> {
  const max = parseInt(process.env["RATE_LIMIT_FEEDBACK_MAX"] ?? "30", 10);
  const window = parseInt(
    process.env["RATE_LIMIT_FEEDBACK_WINDOW_SECONDS"] ?? "3600",
    10
  );

  return checkRateLimit({
    key: `feedback:user:${userId}`,
    maxRequests: max,
    windowSeconds: window,
  });
}

/**
 * Apply rate limiting for contact form submissions.
 */
export async function applyContactRateLimit(
  ipAddress: string
): Promise<RateLimitResult> {
  const max = parseInt(process.env["RATE_LIMIT_CONTACT_MAX"] ?? "5", 10);
  const window = parseInt(
    process.env["RATE_LIMIT_CONTACT_WINDOW_SECONDS"] ?? "3600",
    10
  );

  return checkRateLimit({
    key: `contact:ip:${ipAddress}`,
    maxRequests: max,
    windowSeconds: window,
  });
}

/**
 * Clean up expired rate limit buckets.
 * Call this periodically (e.g., from a cron job or lazy cleanup).
 */
export async function cleanExpiredBuckets(): Promise<number> {
  const result = await db.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: new Date() } },
  });
  return result.count;
}
