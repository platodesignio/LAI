/**
 * Client-safe mode constants — no server imports, no db.
 * Import from here in "use client" components.
 * Import from ./modes in server components and API routes.
 */
import type { ModeType } from "@prisma/client";

export const MODE_DISPLAY: Record<ModeType, { name: string; description: string }> = {
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
