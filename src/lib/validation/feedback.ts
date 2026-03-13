import { z } from "zod";

export const feedbackSchema = z.object({
  executionId: z.string().min(1, "Execution ID is required."),
  conversationId: z.string().cuid().optional(),
  messageId: z.string().cuid().optional(),
  comment: z
    .string()
    .min(1, "Comment is required.")
    .max(2000, "Comment must be at most 2000 characters."),
  rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  email: z.string().email().max(254).optional().or(z.literal("")),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
