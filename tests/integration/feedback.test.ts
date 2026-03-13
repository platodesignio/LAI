/**
 * Integration tests for feedback submission endpoint.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    feedback: {
      create: vi.fn(),
    },
    rateLimitBucket: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  requireSession: vi.fn(),
}));

vi.mock("@/lib/rate-limit/index", () => ({
  applyFeedbackRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetAt: new Date() }),
}));

vi.mock("@/lib/feature-flags", () => ({
  isRateLimitingEnabled: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates feedback and returns 201", async () => {
    const { db } = await import("@/lib/db");
    const { getSession } = await import("@/lib/auth/session");

    vi.mocked(getSession).mockResolvedValueOnce({
      sessionId: "sess_1",
      user: {
        id: "user_1",
        email: "user@example.com",
        name: "User",
        role: "USER",
        emailVerified: new Date(),
      },
    });

    vi.mocked(db.feedback.create).mockResolvedValueOnce({
      id: "fb_1",
      userId: "user_1",
      email: null,
      conversationId: null,
      messageId: null,
      executionId: "exec_abc",
      comment: "Very helpful.",
      rating: 5,
      flagged: false,
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { POST } = await import("@/app/api/feedback/route");
    const req = makeRequest({
      executionId: "exec_abc",
      comment: "Very helpful.",
      rating: 5,
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const data = await res.json() as { id: string };
    expect(data.id).toBe("fb_1");
  });

  it("returns 400 when executionId is missing", async () => {
    const { getSession } = await import("@/lib/auth/session");
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/feedback/route");
    const req = makeRequest({ comment: "Helpful." });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when comment is empty", async () => {
    const { getSession } = await import("@/lib/auth/session");
    vi.mocked(getSession).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/feedback/route");
    const req = makeRequest({ executionId: "exec_abc", comment: "" });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const { getSession } = await import("@/lib/auth/session");
    const { isRateLimitingEnabled } = await import("@/lib/feature-flags");
    const { applyFeedbackRateLimit } = await import("@/lib/rate-limit/index");

    vi.mocked(getSession).mockResolvedValueOnce({
      sessionId: "sess_1",
      user: { id: "user_1", email: "u@e.com", name: "U", role: "USER", emailVerified: new Date() },
    });
    vi.mocked(isRateLimitingEnabled).mockResolvedValueOnce(true);
    vi.mocked(applyFeedbackRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600_000),
    });

    const { POST } = await import("@/app/api/feedback/route");
    const req = makeRequest({ executionId: "exec_abc", comment: "Too many." });
    const res = await POST(req as never);
    expect(res.status).toBe(429);
  });
});
