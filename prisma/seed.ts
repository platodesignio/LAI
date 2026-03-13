/**
 * Seed script for local development only.
 * Run: npm run db:seed
 *
 * Creates:
 * - 1 admin user
 * - 1 regular user
 * - 5 active PromptVersions (one per mode)
 * - Feature flags
 * - Example conversations, messages, feedback, notes
 */

import { PrismaClient, ModeType, NoteType, Severity } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const MODE_PROMPTS: Record<ModeType, string> = {
  QUIET_MIRROR: `You are operating in Quiet Mirror mode. Your task is not to reassure. Your task is not to motivate. Your task is not to dramatize. Return a cleaner picture of the user's actual situation.

Rules:
- Reduce emotional inflation.
- Identify hidden premise, ambiguity, avoidance, contradiction, and displacement.
- Distinguish fact, interpretation, fear, and projection.
- Prefer short, exact language.
- Do not flatter. Do not console mechanically. Do not intensify identity narratives.
- End with a small number of actionable clarifications when useful.`,

  STRATEGIC_GOVERNANCE: `You are operating in Strategic Governance mode. Your task is to structure difficult decisions under constraint.

Rules:
- Separate principle, structure, resource limitation, execution risk, and second-order effect.
- Distinguish what is legitimate from what is merely efficient.
- Distinguish policy logic from personal preference.
- Show tradeoffs clearly.
- Do not collapse governance into sentiment.
- Do not use vague corporate filler.
- Prefer concise operational language.
- When necessary, produce a decision frame with options, risks, and implementation implications.`,

  CONFLICT_DISSOLUTION: `You are operating in Conflict Dissolution mode. Your task is to reduce escalation without coaching manipulation.

Rules:
- Lower thermal load.
- Preserve dignity where possible.
- Distinguish grievance, fact, interpretation, demand, and threat.
- Avoid tactical domination language.
- Avoid revenge framing.
- Draft language that increases clarity and lowers needless friction.
- Do not encourage deception.
- Prefer language that can actually be sent in real situations.`,

  PERSONAL_DISCIPLINE: `You are operating in Personal Discipline mode. Your task is to convert vague intention into repeatable protocol.

Rules:
- Translate desire into sequence, trigger, constraint, and review loop.
- Use implementation structure rather than encouragement.
- Avoid hype. Avoid identity grandiosity.
- Prefer concrete, repeatable, and low-friction actions.
- Surface likely failure points.
- When useful, provide a protocol format with trigger, action, boundary, review, and reset.`,

  INSTITUTIONAL_JUDGMENT: `You are operating in Institutional Judgment mode. Your task is to assess matters involving policy, ethics, governance, or public responsibility.

Rules:
- Separate private morality, public legitimacy, legal boundary, operational feasibility, and precedent effects.
- Do not reduce institutional questions to personal sincerity.
- Do not erase implementation consequences.
- Identify stakeholder exposure, accountability pathways, and downstream risks.
- Prefer precise and sober language.
- When useful, produce a structured institutional brief.`,
};

const FEATURE_FLAGS = [
  {
    key: "chat_enabled",
    enabled: true,
    description: "Master toggle for chat functionality.",
  },
  {
    key: "registration_enabled",
    enabled: true,
    description: "Allow new user registration.",
  },
  {
    key: "feedback_enabled",
    enabled: true,
    description: "Allow users to submit feedback on messages.",
  },
  {
    key: "note_conversion_enabled",
    enabled: true,
    description: "Allow users to convert chat outputs into saved notes.",
  },
  {
    key: "contact_enabled",
    enabled: true,
    description: "Enable the public contact form.",
  },
  {
    key: "rate_limiting_enabled",
    enabled: true,
    description: "Master toggle for rate limiting. Disable only in dev.",
  },
  {
    key: "chat_provider_override",
    enabled: false,
    description:
      'Override AI_PROVIDER env var. Set metadata.provider to "anthropic" or "openai".',
    metadata: { provider: "anthropic" },
  },
];

async function main() {
  console.log("Starting seed...");

  // -----------------------------------------------------------------------
  // Admin user
  // -----------------------------------------------------------------------
  const adminEmail = process.env["ADMIN_EMAIL"] ?? "admin@laozi.ai";
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "Admin123!ChangeThis";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`Admin user: ${admin.email}`);

  // -----------------------------------------------------------------------
  // Regular user
  // -----------------------------------------------------------------------
  const userHash = await bcrypt.hash("User123!Demo", 12);
  const regularUser = await db.user.upsert({
    where: { email: "demo@laozi.ai" },
    update: {},
    create: {
      email: "demo@laozi.ai",
      name: "Demo User",
      passwordHash: userHash,
      role: "USER",
      emailVerified: new Date(),
    },
  });
  console.log(`Demo user: ${regularUser.email}`);

  // -----------------------------------------------------------------------
  // Prompt versions (one per mode, seeded at version 1, active)
  // -----------------------------------------------------------------------
  const modes = Object.keys(MODE_PROMPTS) as ModeType[];
  for (const mode of modes) {
    const existing = await db.promptVersion.findFirst({
      where: { mode, version: 1 },
    });
    if (!existing) {
      await db.promptVersion.create({
        data: {
          mode,
          version: 1,
          systemPrompt: MODE_PROMPTS[mode] ?? "",
          isActive: true,
          createdBy: admin.id,
          notes: "Initial seed version.",
        },
      });
    }
    console.log(`PromptVersion seeded: ${mode} v1`);
  }

  // -----------------------------------------------------------------------
  // Feature flags
  // -----------------------------------------------------------------------
  for (const flag of FEATURE_FLAGS) {
    await db.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
    console.log(`FeatureFlag: ${flag.key}`);
  }

  // -----------------------------------------------------------------------
  // Example conversation + messages + feedback + note
  // -----------------------------------------------------------------------
  const existingConvo = await db.conversation.findFirst({
    where: { userId: regularUser.id },
  });

  if (!existingConvo) {
    const conversation = await db.conversation.create({
      data: {
        userId: regularUser.id,
        mode: "QUIET_MIRROR",
        title: "Initial reflection on decision paralysis",
      },
    });

    const promptVersion = await db.promptVersion.findFirst({
      where: { mode: "QUIET_MIRROR", isActive: true },
    });

    const executionId = `exec_seed_${Date.now()}`;

    const userMsg = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content:
          "I keep postponing a decision about changing roles. Every time I'm about to commit I find new reasons to wait. I'm not sure if I'm being careful or just afraid.",
      },
    });

    const assistantMsg = await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content:
          'The pattern you are describing — repeated postponement with newly discovered reasons — is a signature of avoidance dressed as analysis. The question worth examining is not whether the reasons are valid (some probably are) but whether you are generating them to justify a pre-existing reluctance.\n\nA few distinctions to test:\n\n1. **What would change if you decided today?** If the answer involves no material loss — only discomfort — then the delay is not protective, it is procrastinatory.\n\n2. **Are you gathering new information or recycling the same concerns?** If the concerns are cycling, you are not in a research loop. You are in a comfort loop.\n\n3. **What does "afraid" actually name here?** Fear of the wrong role, fear of leaving something known, fear of being seen to have failed if it goes poorly, or fear of commitment itself? These have different remedies.\n\nOne actionable clarification: Can you state in one sentence what outcome you are specifically trying to avoid by waiting? If you cannot state it clearly, the delay is not protecting you from anything specific.',
        executionId,
        modelProvider: "anthropic",
        modelName: "claude-3-5-sonnet-20241022",
        promptVersionId: promptVersion?.id,
        inputTokens: 120,
        outputTokens: 280,
        durationMs: 3200,
      },
    });

    // Feedback linked to execution ID
    await db.feedback.create({
      data: {
        userId: regularUser.id,
        conversationId: conversation.id,
        messageId: assistantMsg.id,
        executionId,
        comment: "This was genuinely useful. The three distinctions helped.",
        rating: 5,
        flagged: false,
        reviewed: false,
      },
    });

    // Saved note converted from conversation
    await db.savedNote.create({
      data: {
        userId: regularUser.id,
        conversationId: conversation.id,
        title: "Decision Paralysis — Self-Analysis",
        content:
          "## Pattern Identified\n\nRepeated postponement with newly found reasons = avoidance disguised as analysis.\n\n## Three Tests\n1. What changes if I decide today?\n2. Am I gathering new info or recycling the same concerns?\n3. What does 'afraid' specifically name?\n\n## Action\nState in one sentence the specific outcome I am trying to avoid by waiting.",
        noteType: NoteType.DECISION_MEMO,
      },
    });

    // Example incident from safety filter
    await db.incident.create({
      data: {
        type: "SAFETY_FILTER_PRE",
        severity: Severity.LOW,
        description: "Pre-model safety filter matched pattern in user message.",
        userId: regularUser.id,
        executionId: `exec_inc_${Date.now()}`,
        metadata: {
          category: "self_harm_monitoring",
          action: "logged_only",
          pattern: "harm_keywords_soft",
        },
        resolved: true,
        resolvedBy: admin.id,
        resolvedAt: new Date(),
      },
    });

    console.log(
      `Example conversation, messages, feedback, note, and incident seeded.`
    );

    // Suppress unused var warnings
    void userMsg;
  }

  // -----------------------------------------------------------------------
  // Audit log entry
  // -----------------------------------------------------------------------
  await db.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED",
      resource: "system",
      metadata: { note: "Initial seed executed." },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
