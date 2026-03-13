import { z } from "zod";

export const noteTypeSchema = z.enum([
  "DECISION_MEMO",
  "JOURNAL_NOTE",
  "OPERATIONAL_PROTOCOL",
  "CONFLICT_RESPONSE_DRAFT",
  "INSTITUTIONAL_BRIEF",
]);

export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200),
  content: z.string().min(1, "Content is required.").max(50000),
  noteType: noteTypeSchema,
  conversationId: z.string().cuid().optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  noteType: noteTypeSchema.optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
