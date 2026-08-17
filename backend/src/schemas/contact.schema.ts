import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(255),
  company: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().trim().min(1).max(120),
  volume: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(2000),
  turnstileToken: z
    .string()
    .trim()
    .min(1, "Turnstile verification is required")
    .max(2048, "Turnstile token is invalid")
    .optional(),
});

export type ContactPayload = z.infer<typeof contactSchema>;
