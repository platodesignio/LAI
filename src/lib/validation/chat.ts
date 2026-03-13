import { z } from "zod";

export const modeSchema = z.enum([
  "QUIET_MIRROR",
  "STRATEGIC_GOVERNANCE",
  "CONFLICT_DISSOLUTION",
  "PERSONAL_DISCIPLINE",
  "INSTITUTIONAL_JUDGMENT",
]);

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

export const chatRequestSchema = z.object({
  conversationId: z.string().cuid(),
  messages: z.array(chatMessageSchema).min(1).max(100),
  mode: modeSchema,
});

export const createConversationSchema = z.object({
  mode: modeSchema,
  title: z.string().max(200).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  archived: z.boolean().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ModeType = z.infer<typeof modeSchema>;
