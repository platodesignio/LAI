/**
 * Integration tests for admin route protection.
 * Verifies that admin routes reject non-admin and unauthenticated requests.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    user: { findMany: vi.fn(), count: vi.fn() },
    featureFlag: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    promptVersion: { findMany: vi.fn(), findFirst: vi.fn() },
    incident: { findMany: vi.fn() },
    feedback: { findMany: vi.fn() },
    auditLog: { findMany: vi.fn(), create: vi.fn() },
    rateLimitBucket: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/utils/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/feature-flags", () => ({
  invalidateFeatureFlagCache: vi.fn(),
  isRateLimitingEnabled: vi.fn().mockResolvedValue(false),
}));

// Mock requireAdmin to simulate access control
const mockRequireAdmin = vi.fn();
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  requireSession: vi.fn(),
  requireAdmin: mockRequireAdmin,
  createSession: vi.fn(),
  destroySession: vi.fn(),
  invalidateAllUserSessions: vi.fn(),
}));

function makeRequest(method: string, url = "http://localhost/api/admin/test") {
  return new Request(url, { method });
}

describe("Admin route protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access to /api/admin/users", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("UNAUTHENTICATED"));

    const { GET } = await import("@/app/api/admin/users/route");
    const req = makeRequest("GET");
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  it("rejects non-admin access to /api/admin/feature-flags", async () => {
    mockRequireAdmin.mockRejectedValueOnce(new Error("FORBIDDEN"));

    const { GET } = await import("@/app/api/admin/feature-flags/route");
    const req = makeRequest("GET");
    const res = await GET(req as never);
    expect(res.status).toBe(403);
  });

  it("allows admin access to /api/admin/users", async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      sessionId: "sess_1",
      user: { id: "admin_1", email: "admin@example.com", role: "ADMIN", name: "Admin", emailVerified: new Date() },
    });

    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findMany).mockResolvedValueOnce([]);
    vi.mocked(db.user.count).mockResolvedValueOnce(0);

    const { GET } = await import("@/app/api/admin/users/route");
    const req = makeRequest("GET", "http://localhost/api/admin/users?page=1&limit=25");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
  });

  it("allows admin to list feature flags", async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      sessionId: "sess_1",
      user: { id: "admin_1", email: "admin@example.com", role: "ADMIN", name: "Admin", emailVerified: new Date() },
    });

    const { db } = await import("@/lib/db");
    vi.mocked(db.featureFlag.findMany).mockResolvedValueOnce([
      {
        id: "flag_1",
        key: "chat_enabled",
        enabled: true,
        description: "Master toggle",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { GET } = await import("@/app/api/admin/feature-flags/route");
    const req = makeRequest("GET");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { flags: unknown[] };
    expect(Array.isArray(data.flags)).toBe(true);
  });

  it("allows admin to list prompt policies", async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      sessionId: "sess_1",
      user: { id: "admin_1", email: "admin@example.com", role: "ADMIN", name: "Admin", emailVerified: new Date() },
    });

    const { db } = await import("@/lib/db");
    vi.mocked(db.promptVersion.findMany).mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/admin/prompt-policies/route");
    const req = makeRequest("GET");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
  });

  it("allows admin to list incidents", async () => {
    mockRequireAdmin.mockResolvedValueOnce({
      sessionId: "sess_1",
      user: { id: "admin_1", email: "admin@example.com", role: "ADMIN", name: "Admin", emailVerified: new Date() },
    });

    const { db } = await import("@/lib/db");
    vi.mocked(db.incident.findMany).mockResolvedValueOnce([]);

    const { GET } = await import("@/app/api/admin/incidents/route");
    const req = makeRequest("GET");
    const res = await GET(req as never);
    expect(res.status).toBe(200);
  });
});

describe("Health endpoint", () => {
  it("returns 200 with db:ok when DB is healthy", async () => {
    const { db } = await import("@/lib/db");
    // Mock $queryRaw (not easily mockable, so we mock the module directly)
    (db as unknown as { $queryRaw: ReturnType<typeof vi.fn> }).$queryRaw = vi.fn().mockResolvedValueOnce([{ "?column?": 1 }]);

    const { GET } = await import("@/app/api/health/route");
    const req = makeRequest("GET");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json() as { status: string };
    expect(data.status).toBe("ok");
  });
});
