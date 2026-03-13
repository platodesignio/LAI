import type { ModeType } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export interface ModeConfig {
  mode: ModeType;
  displayName: string;
  shortDescription: string;
  systemPrompt: string;
  promptVersionId: string;
}

const MODE_DISPLAY: Record<ModeType, { name: string; description: string }> = {
  QUIET_MIRROR: {
    name: "Quiet Mirror",
    description:
      "Returns a cleaner picture of your situation. Reduces emotional inflation. Surfaces hidden premises, contradictions, and avoidance patterns.",
  },
  STRATEGIC_GOVERNANCE: {
    name: "Strategic Governance",
    description:
      "Structures decisions under constraint. Separates principle from preference, legitimacy from efficiency, and risk from noise.",
  },
  CONFLICT_DISSOLUTION: {
    name: "Conflict Dissolution",
    description:
      "Reduces escalation. Distinguishes grievance from demand, fact from interpretation. Drafts language that lowers heat without coaching manipulation.",
  },
  PERSONAL_DISCIPLINE: {
    name: "Personal Discipline",
    description:
      "Converts vague intention into repeatable protocol. Translates aspiration into triggers, constraints, and review loops.",
  },
  INSTITUTIONAL_JUDGMENT: {
    name: "Institutional Judgment",
    description:
      "Assesses policy, governance, and public responsibility. Separates private morality from legal boundary and operational feasibility.",
  },
};

/**
 * Get the active PromptVersion for a mode from the database.
 * Falls back to a hardcoded safe default if DB lookup fails.
 */
export async function getActiveModePrompt(
  mode: ModeType
): Promise<{ systemPrompt: string; promptVersionId: string }> {
  try {
    const promptVersion = await db.promptVersion.findFirst({
      where: { mode, isActive: true },
      orderBy: { version: "desc" },
    });

    if (promptVersion) {
      return {
        systemPrompt: promptVersion.systemPrompt,
        promptVersionId: promptVersion.id,
      };
    }
  } catch (err) {
    logger.error("Failed to load prompt version from DB", {
      mode,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Fallback prompt if DB lookup fails
  const fallback = getFallbackPrompt(mode);
  return { systemPrompt: fallback, promptVersionId: "fallback" };
}

export function getModeDisplayName(mode: ModeType): string {
  return MODE_DISPLAY[mode]?.name ?? mode;
}

export function getModeDescription(mode: ModeType): string {
  return MODE_DISPLAY[mode]?.description ?? "";
}

export function getAllModes(): Array<{
  mode: ModeType;
  name: string;
  description: string;
}> {
  return (Object.keys(MODE_DISPLAY) as ModeType[]).map((mode) => ({
    mode,
    name: MODE_DISPLAY[mode]!.name,
    description: MODE_DISPLAY[mode]!.description,
  }));
}

function getFallbackPrompt(mode: ModeType): string {
  const prompts: Record<ModeType, string> = {
    QUIET_MIRROR: `You are operating in Quiet Mirror mode. Return a cleaner picture of the user's actual situation without reassurance, motivation, or dramatization. Identify hidden premises, ambiguity, avoidance, contradiction, and displacement. Prefer short, exact language. Do not flatter or console mechanically.`,
    STRATEGIC_GOVERNANCE: `You are operating in Strategic Governance mode. Structure difficult decisions under constraint. Separate principle, structure, resource limitation, execution risk, and second-order effects. Show tradeoffs clearly. Prefer concise operational language.`,
    CONFLICT_DISSOLUTION: `You are operating in Conflict Dissolution mode. Reduce escalation without coaching manipulation. Distinguish grievance, fact, interpretation, demand, and threat. Draft language that increases clarity and lowers friction.`,
    PERSONAL_DISCIPLINE: `You are operating in Personal Discipline mode. Convert vague intention into repeatable protocol. Translate desire into sequence, trigger, constraint, and review loop. Surface likely failure points.`,
    INSTITUTIONAL_JUDGMENT: `You are operating in Institutional Judgment mode. Assess policy, ethics, governance, and public responsibility. Separate private morality, public legitimacy, legal boundary, operational feasibility, and precedent effects.`,
  };
  return prompts[mode] ?? "You are a helpful assistant.";
}
