/**
 * Server-side mode utilities — imports db. Do NOT import in "use client" components.
 * For display helpers usable on the client, import from ./mode-constants instead.
 */
import type { ModeType } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

// Re-export client-safe helpers so server components only need one import.
export { getModeDisplayName, getModeDescription, getAllModes } from "./mode-constants";

export interface ModeConfig {
  mode: ModeType;
  displayName: string;
  shortDescription: string;
  systemPrompt: string;
  promptVersionId: string;
}

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
