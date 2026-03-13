import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random token.
 * Used for session tokens, email verification, and password reset.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Generate a token with a future expiry timestamp.
 */
export function generateTokenWithExpiry(
  bytes = 32,
  ttlSeconds = 3600
): { token: string; expiry: Date } {
  return {
    token: generateToken(bytes),
    expiry: new Date(Date.now() + ttlSeconds * 1000),
  };
}
