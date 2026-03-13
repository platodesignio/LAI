import { logIncident } from "@/lib/utils/incidents";
import { logger } from "@/lib/utils/logger";

export interface SafetyCheckResult {
  safe: boolean;
  category?: string;
  action: "allow" | "block" | "log_and_allow";
  reason?: string;
}

// Categories matched at the pre-model stage (user input).
// These are pattern-based heuristics, not a full moderation service.
// Matched content is logged as an incident; blocking is reserved for severe cases.
const PRE_MODEL_PATTERNS: Array<{
  category: string;
  patterns: RegExp[];
  action: "block" | "log_and_allow";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}> = [
  {
    category: "self_harm_explicit",
    patterns: [
      /\b(how to (kill|hurt|harm) (myself|yourself))\b/i,
      /\b(suicide method|ways to die|lethal dose)\b/i,
    ],
    action: "log_and_allow",
    severity: "HIGH",
  },
  {
    category: "harassment_targeting",
    patterns: [
      /\b(how to (stalk|track|locate) (someone|a person|a woman|a man))\b/i,
      /\b(dox|doxxing|find (someone'?s? )?(address|location|home))\b/i,
    ],
    action: "log_and_allow",
    severity: "MEDIUM",
  },
  {
    category: "fraud_coercion",
    patterns: [
      /\b(phishing email|fake invoice|impersonate|wire transfer scam)\b/i,
      /\b(how to manipulate|coerce (someone|a person) into)\b/i,
    ],
    action: "log_and_allow",
    severity: "MEDIUM",
  },
  {
    category: "explicit_abuse",
    patterns: [
      /\b(child sexual|csam|grooming (a child|children))\b/i,
    ],
    action: "block",
    severity: "CRITICAL",
  },
];

// Categories matched at the post-model stage (assistant output).
const POST_MODEL_PATTERNS: Array<{
  category: string;
  patterns: RegExp[];
  action: "block" | "log_and_allow";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}> = [
  {
    category: "medical_advice_claim",
    patterns: [
      /\b(you (should|must) (take|stop taking) (medication|medicine|pills|drugs))\b/i,
      /\b(clinical diagnosis|diagnosing you with|you have [a-z]+ disorder)\b/i,
    ],
    action: "log_and_allow",
    severity: "MEDIUM",
  },
  {
    category: "legal_advice_claim",
    patterns: [
      /\b(you (are|are not) legally liable|sue (them|him|her) for)\b/i,
      /\b(this (is|is not) illegal under)\b/i,
    ],
    action: "log_and_allow",
    severity: "LOW",
  },
];

/**
 * Run pre-model safety check on user input.
 * Returns a SafetyCheckResult. If action is "block", do not proceed to the model.
 */
export async function preModelSafetyCheck(
  content: string,
  options?: { userId?: string; executionId?: string; requestId?: string }
): Promise<SafetyCheckResult> {
  for (const rule of PRE_MODEL_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(content)) {
        logger.warn("Pre-model safety match", {
          category: rule.category,
          action: rule.action,
          userId: options?.userId,
          executionId: options?.executionId,
        });

        await logIncident({
          type: "SAFETY_FILTER_PRE",
          severity: rule.severity,
          description: `Pre-model safety filter matched category: ${rule.category}`,
          userId: options?.userId,
          executionId: options?.executionId,
          requestId: options?.requestId,
          metadata: {
            category: rule.category,
            action: rule.action,
          },
        });

        if (rule.action === "block") {
          return {
            safe: false,
            category: rule.category,
            action: "block",
            reason: "This request cannot be processed.",
          };
        }

        return {
          safe: true,
          category: rule.category,
          action: "log_and_allow",
        };
      }
    }
  }

  return { safe: true, action: "allow" };
}

/**
 * Run post-model safety check on assistant output.
 */
export async function postModelSafetyCheck(
  content: string,
  options?: { userId?: string; executionId?: string; requestId?: string }
): Promise<SafetyCheckResult> {
  for (const rule of POST_MODEL_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(content)) {
        logger.warn("Post-model safety match", {
          category: rule.category,
          action: rule.action,
          userId: options?.userId,
          executionId: options?.executionId,
        });

        await logIncident({
          type: "SAFETY_FILTER_POST",
          severity: rule.severity,
          description: `Post-model safety filter matched category: ${rule.category}`,
          userId: options?.userId,
          executionId: options?.executionId,
          requestId: options?.requestId,
          metadata: {
            category: rule.category,
            action: rule.action,
          },
        });

        if (rule.action === "block") {
          return {
            safe: false,
            category: rule.category,
            action: "block",
            reason: "This response has been withheld.",
          };
        }

        return {
          safe: true,
          category: rule.category,
          action: "log_and_allow",
        };
      }
    }
  }

  return { safe: true, action: "allow" };
}
