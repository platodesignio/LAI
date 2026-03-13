/**
 * Integration tests for auth API routes.
 *
 * These tests mock the DB and external services to verify
 * the route handler logic without a real database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies before importing route handlers
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_password"),
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/auth/tokens", () => ({
  generateToken: vi.fn().mockReturnValue("mock_token_hex"),
  generateTokenWithExpiry: vi.fn().mockReturnValue({
    token: "mock_token",
    expiry: new Date(Date.now() + 86400_000),
  }),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  requireSession: vi.fn(),
  requireAdmin: vi.fn(),
  createSession: vi.fn(),
  destroySession: vi.fn(),
  invalidateAllUserSessions: vi.fn(),
  COOKIE_NAME: "laozi_session",
}));

vi.mock("@/lib/email/index", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/email/templates", () => ({
  verificationEmailTemplate: vi.fn().mockReturnValue({
    subject: "Verify your email",
    html: "<p>Verify</p>",
    text: "Verify",
  }),
  passwordResetEmailTemplate: vi.fn().mockReturnValue({
    subject: "Reset your password",
    html: "<p>Reset</p>",
    text: "Reset",
  }),
}));

vi.mock("@/lib/rate-limit/index", () => ({
  applyAuthRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: new Date() }),
  applyChatRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 19, resetAt: new Date() }),
  applyFeedbackRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29, resetAt: new Date() }),
  applyContactRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetAt: new Date() }),
}));

vi.mock("@/lib/feature-flags", () => ({
  isRateLimitingEnabled: vi.fn().mockResolvedValue(false),
  isChatEnabled: vi.fn().mockResolvedValue(true),
  isRegistrationEnabled: vi.fn().mockResolvedValue(true),
  getActiveAIProvider: vi.fn().mockResolvedValue("anthropic"),
  invalidateFeatureFlagCache: vi.fn(),
}));

vi.mock("@/lib/utils/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Helper to build a Next.js Request
function makeRequest(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
) {
  return new Request("http://localhost:3000/api/auth/test", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user and returns 201", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null); // no existing user
    vi.mocked(db.user.create).mockResolvedValueOnce({
      id: "user_1",
      email: "test@example.com",
      name: "Test",
      passwordHash: "hash",
      role: "USER",
      emailVerified: null,
      verificationToken: "token",
      verificationExpiry: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest("POST", {
      email: "test@example.com",
      password: "ValidPass1",
      name: "Test",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const data = await res.json() as { message: string };
    expect(data.message).toContain("verify");
  });

  it("returns 409 if email already exists", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: "user_existing",
      email: "existing@example.com",
      name: null,
      passwordHash: "hash",
      role: "USER",
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest("POST", {
      email: "existing@example.com",
      password: "ValidPass1",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(409);
  });

  it("returns 400 on invalid input", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest("POST", { email: "bad-email", password: "weak" });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when registration is disabled", async () => {
    const { isRegistrationEnabled } = await import("@/lib/feature-flags");
    vi.mocked(isRegistrationEnabled).mockResolvedValueOnce(false);

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest("POST", {
      email: "test@example.com",
      password: "ValidPass1",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and creates session for valid credentials", async () => {
    const { db } = await import("@/lib/db");
    const { verifyPassword } = await import("@/lib/auth/password");
    const { createSession } = await import("@/lib/auth/session");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: "user_1",
      email: "test@example.com",
      name: "Test",
      passwordHash: "hashed_password",
      role: "USER",
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);
    vi.mocked(createSession).mockResolvedValueOnce(undefined);

    const { POST } = await import("@/app/api/auth/login/route");
    const req = makeRequest("POST", {
      email: "test@example.com",
      password: "ValidPass1",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(createSession).toHaveBeenCalled();
  });

  it("returns 401 for unknown email", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/auth/login/route");
    const req = makeRequest("POST", {
      email: "nobody@example.com",
      password: "ValidPass1",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong password", async () => {
    const { db } = await import("@/lib/db");
    const { verifyPassword } = await import("@/lib/auth/password");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: "user_1",
      email: "test@example.com",
      name: null,
      passwordHash: "hashed_password",
      role: "USER",
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    const { POST } = await import("@/app/api/auth/login/route");
    const req = makeRequest("POST", {
      email: "test@example.com",
      password: "WrongPass1",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 EMAIL_NOT_VERIFIED when email not verified", async () => {
    const { db } = await import("@/lib/db");
    const { verifyPassword } = await import("@/lib/auth/password");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: "user_1",
      email: "unverified@example.com",
      name: null,
      passwordHash: "hashed_password",
      role: "USER",
      emailVerified: null, // not verified
      verificationToken: "token",
      verificationExpiry: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);

    const { POST } = await import("@/app/api/auth/login/route");
    const req = makeRequest("POST", {
      email: "unverified@example.com",
      password: "ValidPass1",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(403);
    const data = await res.json() as { error: string };
    expect(data.error).toBe("EMAIL_NOT_VERIFIED");
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("always returns 200 (prevents enumeration)", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = makeRequest("POST", { email: "nobody@example.com" });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it("sends reset email when user exists", async () => {
    const { db } = await import("@/lib/db");
    const { sendEmail } = await import("@/lib/email/index");
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: "user_1",
      email: "known@example.com",
      name: null,
      passwordHash: "hash",
      role: "USER",
      emailVerified: new Date(),
      verificationToken: null,
      verificationExpiry: null,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.user.update).mockResolvedValueOnce({} as never);

    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = makeRequest("POST", { email: "known@example.com" });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalled();
  });
});
