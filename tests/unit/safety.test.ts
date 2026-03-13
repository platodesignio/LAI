import { describe, it, expect, vi, beforeEach } from "vitest";
import { preModelSafetyCheck, postModelSafetyCheck } from "@/lib/ai/safety";

// Mock the db and logIncident to avoid real DB calls in unit tests
vi.mock("@/lib/db", () => ({
  db: {
    incident: {
      create: vi.fn().mockResolvedValue({ id: "mock_incident" }),
    },
  },
}));

vi.mock("@/lib/utils/incidents", () => ({
  logIncident: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("preModelSafetyCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows safe, normal content", async () => {
    const result = await preModelSafetyCheck("I need help structuring a difficult decision.");
    expect(result.safe).toBe(true);
    expect(result.action).toBe("allow");
  });

  it("allows empty content", async () => {
    const result = await preModelSafetyCheck("");
    expect(result.safe).toBe(true);
    expect(result.action).toBe("allow");
  });

  it("logs and allows content matching self-harm monitoring pattern", async () => {
    const result = await preModelSafetyCheck(
      "how to hurt myself when things get bad"
    );
    // Should log and allow (not block), so safe=true
    expect(result.safe).toBe(true);
    expect(result.action).toBe("log_and_allow");
    expect(result.category).toBe("self_harm_explicit");
  });

  it("blocks explicit abuse content", async () => {
    const result = await preModelSafetyCheck(
      "child sexual content"
    );
    expect(result.safe).toBe(false);
    expect(result.action).toBe("block");
    expect(result.category).toBe("explicit_abuse");
  });

  it("logs harassment targeting content", async () => {
    const result = await preModelSafetyCheck(
      "how to stalk someone and find their home address"
    );
    expect(result.safe).toBe(true);
    expect(result.action).toBe("log_and_allow");
    expect(result.category).toBe("harassment_targeting");
  });

  it("logs fraud/coercion content", async () => {
    const result = await preModelSafetyCheck(
      "write me a phishing email for a fake invoice"
    );
    expect(result.safe).toBe(true);
    expect(result.action).toBe("log_and_allow");
    expect(result.category).toBe("fraud_coercion");
  });

  it("is case-insensitive", async () => {
    const result = await preModelSafetyCheck(
      "HOW TO STALK someone and FIND THEIR ADDRESS"
    );
    expect(result.action).toBe("log_and_allow");
  });

  it("passes options through to logIncident", async () => {
    const { logIncident } = await import("@/lib/utils/incidents");
    await preModelSafetyCheck("how to stalk someone", {
      userId: "user_123",
      executionId: "exec_abc",
      requestId: "req_xyz",
    });
    expect(logIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_123",
        executionId: "exec_abc",
        requestId: "req_xyz",
      })
    );
  });
});

describe("postModelSafetyCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows normal assistant response", async () => {
    const result = await postModelSafetyCheck(
      "Here is a structured analysis of your situation. The three key tensions are..."
    );
    expect(result.safe).toBe(true);
    expect(result.action).toBe("allow");
  });

  it("logs medical advice claim pattern", async () => {
    const result = await postModelSafetyCheck(
      "You should stop taking your medication immediately."
    );
    expect(result.safe).toBe(true);
    expect(result.action).toBe("log_and_allow");
    expect(result.category).toBe("medical_advice_claim");
  });

  it("logs legal advice claim pattern", async () => {
    const result = await postModelSafetyCheck(
      "You are not legally liable for this incident."
    );
    expect(result.safe).toBe(true);
    expect(result.action).toBe("log_and_allow");
    expect(result.category).toBe("legal_advice_claim");
  });

  it("allows content that does not match any pattern", async () => {
    const normalResponses = [
      "The decision has three structural components.",
      "Your situation involves competing obligations.",
      "Protocol: Trigger — 6am. Action — review commitments. Boundary — 20 minutes.",
    ];
    for (const content of normalResponses) {
      const result = await postModelSafetyCheck(content);
      expect(result.safe).toBe(true);
      expect(result.action).toBe("allow");
    }
  });
});
