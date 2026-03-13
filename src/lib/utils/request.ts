import { NextRequest } from "next/server";

/**
 * Extract the real client IP from a request, respecting Vercel's forwarded headers.
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Extract the request ID from headers (set by middleware).
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id") ?? "unknown";
}

/**
 * Return a standardized JSON error response.
 */
export function apiError(
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(details ? { details } : {}),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Return a standardized JSON success response.
 */
export function apiSuccess<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
