import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { chatRequestSchema, createConversationSchema } from "@/lib/validation/chat";
import { feedbackSchema } from "@/lib/validation/feedback";
import { contactSchema } from "@/lib/validation/contact";
import { createNoteSchema } from "@/lib/validation/notes";

// =============================================================================
// AUTH VALIDATORS
// =============================================================================

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "ValidPass1",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "ValidPass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "nouppercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "NoNumberHere",
    });
    expect(result.success).toBe(false);
  });

  it("allows registration without name", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "ValidPass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects email longer than 254 chars", () => {
    const result = registerSchema.safeParse({
      email: "a".repeat(250) + "@x.com",
      password: "ValidPass1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "pass" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects non-email string", () => {
    const result = forgotPasswordSchema.safeParse({ email: "notanemail" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid reset data", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "NewPass1",
      confirmPassword: "NewPass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "NewPass1",
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors;
      expect(issues["confirmPassword"]).toBeDefined();
    }
  });

  it("rejects empty token", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "NewPass1",
      confirmPassword: "NewPass1",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// CHAT VALIDATORS
// =============================================================================

describe("chatRequestSchema", () => {
  const validId = "clxxxxxxxxxxxxxxxxxxxxxxxxx"; // cuid-like

  it("accepts valid chat request", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: validId,
      messages: [{ role: "user", content: "Hello" }],
      mode: "QUIET_MIRROR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown mode", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: validId,
      messages: [{ role: "user", content: "Hello" }],
      mode: "INVALID_MODE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty messages array", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: validId,
      messages: [],
      mode: "QUIET_MIRROR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message content exceeding 8000 chars", () => {
    const result = chatRequestSchema.safeParse({
      conversationId: validId,
      messages: [{ role: "user", content: "x".repeat(8001) }],
      mode: "QUIET_MIRROR",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid modes", () => {
    const modes = [
      "QUIET_MIRROR",
      "STRATEGIC_GOVERNANCE",
      "CONFLICT_DISSOLUTION",
      "PERSONAL_DISCIPLINE",
      "INSTITUTIONAL_JUDGMENT",
    ];
    for (const mode of modes) {
      const result = chatRequestSchema.safeParse({
        conversationId: validId,
        messages: [{ role: "user", content: "Test" }],
        mode,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("createConversationSchema", () => {
  it("accepts valid mode", () => {
    const result = createConversationSchema.safeParse({ mode: "QUIET_MIRROR" });
    expect(result.success).toBe(true);
  });

  it("rejects missing mode", () => {
    const result = createConversationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts optional title", () => {
    const result = createConversationSchema.safeParse({
      mode: "PERSONAL_DISCIPLINE",
      title: "My protocol session",
    });
    expect(result.success).toBe(true);
  });

  it("rejects title over 200 chars", () => {
    const result = createConversationSchema.safeParse({
      mode: "PERSONAL_DISCIPLINE",
      title: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// FEEDBACK VALIDATOR
// =============================================================================

describe("feedbackSchema", () => {
  it("accepts valid feedback", () => {
    const result = feedbackSchema.safeParse({
      executionId: "exec_abc123",
      comment: "This was helpful.",
      rating: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing executionId", () => {
    const result = feedbackSchema.safeParse({ comment: "Good." });
    expect(result.success).toBe(false);
  });

  it("rejects empty comment", () => {
    const result = feedbackSchema.safeParse({
      executionId: "exec_abc",
      comment: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating out of range", () => {
    const result = feedbackSchema.safeParse({
      executionId: "exec_abc",
      comment: "Bad rating",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating below 1", () => {
    const result = feedbackSchema.safeParse({
      executionId: "exec_abc",
      comment: "Bad rating",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional email", () => {
    const result = feedbackSchema.safeParse({
      executionId: "exec_abc",
      comment: "Note with email",
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = feedbackSchema.safeParse({
      executionId: "exec_abc",
      comment: "Note with email",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// CONTACT VALIDATOR
// =============================================================================

describe("contactSchema", () => {
  it("accepts valid contact submission", () => {
    const result = contactSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      subject: "General inquiry",
      message: "I have a question about the service.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects message shorter than 10 chars", () => {
    const result = contactSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      subject: "Hi",
      message: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = contactSchema.safeParse({
      email: "jane@example.com",
      subject: "Hi",
      message: "Long enough message here.",
    });
    expect(result.success).toBe(false);
  });
});

// =============================================================================
// NOTES VALIDATOR
// =============================================================================

describe("createNoteSchema", () => {
  it("accepts valid note", () => {
    const result = createNoteSchema.safeParse({
      title: "My decision memo",
      content: "Some content here.",
      noteType: "DECISION_MEMO",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown noteType", () => {
    const result = createNoteSchema.safeParse({
      title: "Title",
      content: "Content",
      noteType: "UNKNOWN_TYPE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createNoteSchema.safeParse({
      title: "",
      content: "Content",
      noteType: "JOURNAL_NOTE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid note types", () => {
    const types = [
      "DECISION_MEMO",
      "JOURNAL_NOTE",
      "OPERATIONAL_PROTOCOL",
      "CONFLICT_RESPONSE_DRAFT",
      "INSTITUTIONAL_BRIEF",
    ];
    for (const noteType of types) {
      const result = createNoteSchema.safeParse({
        title: "Title",
        content: "Content",
        noteType,
      });
      expect(result.success).toBe(true);
    }
  });
});
