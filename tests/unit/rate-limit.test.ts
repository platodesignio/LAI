import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit/index";

vi.mock("@/lib/db", () => ({
  db: {
    rateLimitBucket: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/incidents", () => ({
  logIncident: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows first request when no bucket exists", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.rateLimitBucket.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.rateLimitBucket.upsert).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 1,
      resetAt: new Date(Date.now() + 3600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkRateLimit({
      key: "test:key",
      maxRequests: 10,
      windowSeconds: 3600,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("allows request when count is below limit", async () => {
    const { db } = await import("@/lib/db");
    const futureReset = new Date(Date.now() + 3600_000);
    vi.mocked(db.rateLimitBucket.findUnique).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 5,
      resetAt: futureReset,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.rateLimitBucket.update).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 6,
      resetAt: futureReset,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkRateLimit({
      key: "test:key",
      maxRequests: 10,
      windowSeconds: 3600,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("denies request when count equals limit", async () => {
    const { db } = await import("@/lib/db");
    const futureReset = new Date(Date.now() + 3600_000);
    vi.mocked(db.rateLimitBucket.findUnique).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 10,
      resetAt: futureReset,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkRateLimit({
      key: "test:key",
      maxRequests: 10,
      windowSeconds: 3600,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetAt).toEqual(futureReset);
  });

  it("resets bucket when window has expired", async () => {
    const { db } = await import("@/lib/db");
    const pastReset = new Date(Date.now() - 1000); // expired 1 second ago
    vi.mocked(db.rateLimitBucket.findUnique).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 10, // was at limit
      resetAt: pastReset, // but window expired
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.rateLimitBucket.upsert).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 1,
      resetAt: new Date(Date.now() + 3600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkRateLimit({
      key: "test:key",
      maxRequests: 10,
      windowSeconds: 3600,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(db.rateLimitBucket.upsert).toHaveBeenCalled();
  });

  it("returns resetAt from the existing bucket", async () => {
    const { db } = await import("@/lib/db");
    const futureReset = new Date(Date.now() + 1800_000);
    vi.mocked(db.rateLimitBucket.findUnique).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 3,
      resetAt: futureReset,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.rateLimitBucket.update).mockResolvedValueOnce({
      id: "bucket_1",
      key: "test:key",
      count: 4,
      resetAt: futureReset,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await checkRateLimit({
      key: "test:key",
      maxRequests: 20,
      windowSeconds: 3600,
    });

    expect(result.resetAt).toEqual(futureReset);
  });
});
