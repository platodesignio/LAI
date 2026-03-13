import { describe, it, expect, vi } from "vitest";
import {
  getAllModes,
  getModeDisplayName,
  getModeDescription,
  getActiveModePrompt,
} from "@/lib/ai/modes";
import type { ModeType } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    promptVersion: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("getAllModes", () => {
  it("returns all 5 modes", () => {
    const modes = getAllModes();
    expect(modes).toHaveLength(5);
  });

  it("includes the expected mode keys", () => {
    const modes = getAllModes();
    const modeKeys = modes.map((m) => m.mode);
    expect(modeKeys).toContain("QUIET_MIRROR");
    expect(modeKeys).toContain("STRATEGIC_GOVERNANCE");
    expect(modeKeys).toContain("CONFLICT_DISSOLUTION");
    expect(modeKeys).toContain("PERSONAL_DISCIPLINE");
    expect(modeKeys).toContain("INSTITUTIONAL_JUDGMENT");
  });

  it("each mode has name and description", () => {
    const modes = getAllModes();
    for (const mode of modes) {
      expect(mode.name).toBeTruthy();
      expect(mode.description).toBeTruthy();
      expect(mode.description.length).toBeGreaterThan(20);
    }
  });
});

describe("getModeDisplayName", () => {
  it("returns display name for QUIET_MIRROR", () => {
    expect(getModeDisplayName("QUIET_MIRROR")).toBe("Quiet Mirror");
  });

  it("returns display name for STRATEGIC_GOVERNANCE", () => {
    expect(getModeDisplayName("STRATEGIC_GOVERNANCE")).toBe("Strategic Governance");
  });

  it("returns display name for CONFLICT_DISSOLUTION", () => {
    expect(getModeDisplayName("CONFLICT_DISSOLUTION")).toBe("Conflict Dissolution");
  });

  it("returns display name for PERSONAL_DISCIPLINE", () => {
    expect(getModeDisplayName("PERSONAL_DISCIPLINE")).toBe("Personal Discipline");
  });

  it("returns display name for INSTITUTIONAL_JUDGMENT", () => {
    expect(getModeDisplayName("INSTITUTIONAL_JUDGMENT")).toBe("Institutional Judgment");
  });
});

describe("getModeDescription", () => {
  it("returns a non-empty description for each mode", () => {
    const modes: ModeType[] = [
      "QUIET_MIRROR",
      "STRATEGIC_GOVERNANCE",
      "CONFLICT_DISSOLUTION",
      "PERSONAL_DISCIPLINE",
      "INSTITUTIONAL_JUDGMENT",
    ];
    for (const mode of modes) {
      const desc = getModeDescription(mode);
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(10);
    }
  });
});

describe("getActiveModePrompt", () => {
  it("returns prompt from DB when a version is found", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.promptVersion.findFirst).mockResolvedValueOnce({
      id: "pv_123",
      mode: "QUIET_MIRROR",
      version: 1,
      systemPrompt: "You are in Quiet Mirror mode. Do not flatter.",
      isActive: true,
      createdBy: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getActiveModePrompt("QUIET_MIRROR");
    expect(result.systemPrompt).toBe("You are in Quiet Mirror mode. Do not flatter.");
    expect(result.promptVersionId).toBe("pv_123");
  });

  it("falls back to hardcoded prompt when DB returns null", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.promptVersion.findFirst).mockResolvedValueOnce(null);

    const result = await getActiveModePrompt("QUIET_MIRROR");
    expect(result.systemPrompt).toBeTruthy();
    expect(result.promptVersionId).toBe("fallback");
  });

  it("falls back to hardcoded prompt when DB throws", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.promptVersion.findFirst).mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const result = await getActiveModePrompt("STRATEGIC_GOVERNANCE");
    expect(result.systemPrompt).toBeTruthy();
    expect(result.promptVersionId).toBe("fallback");
  });

  it("provides fallback prompts for all 5 modes", async () => {
    const { db } = await import("@/lib/db");
    const modes: ModeType[] = [
      "QUIET_MIRROR",
      "STRATEGIC_GOVERNANCE",
      "CONFLICT_DISSOLUTION",
      "PERSONAL_DISCIPLINE",
      "INSTITUTIONAL_JUDGMENT",
    ];

    for (const mode of modes) {
      vi.mocked(db.promptVersion.findFirst).mockResolvedValueOnce(null);
      const result = await getActiveModePrompt(mode);
      expect(result.systemPrompt.length).toBeGreaterThan(20);
      expect(result.promptVersionId).toBe("fallback");
    }
  });
});
