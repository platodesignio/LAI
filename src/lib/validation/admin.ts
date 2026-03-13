import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().max(100).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  emailVerified: z.boolean().optional(),
});

export const resolveIncidentSchema = z.object({
  resolved: z.boolean(),
  resolvedBy: z.string().optional(),
});

export const reviewFeedbackSchema = z.object({
  reviewed: z.boolean(),
  flagged: z.boolean().optional(),
});

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createPromptVersionSchema = z.object({
  mode: z.enum([
    "QUIET_MIRROR",
    "STRATEGIC_GOVERNANCE",
    "CONFLICT_DISSOLUTION",
    "PERSONAL_DISCIPLINE",
    "INSTITUTIONAL_JUDGMENT",
  ]),
  systemPrompt: z
    .string()
    .min(10, "System prompt must be at least 10 characters.")
    .max(8000),
  notes: z.string().max(1000).optional(),
  activate: z.boolean().default(false),
});

export const updatePromptVersionSchema = z.object({
  systemPrompt: z
    .string()
    .min(10, "System prompt must be at least 10 characters.")
    .max(8000)
    .optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreatePromptVersionInput = z.infer<typeof createPromptVersionSchema>;
export type UpdatePromptVersionInput = z.infer<typeof updatePromptVersionSchema>;
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>;
