import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z.string().email("Invalid email address.").max(254),
  subject: z.string().min(1, "Subject is required.").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters.")
    .max(3000, "Message must be at most 3000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;
