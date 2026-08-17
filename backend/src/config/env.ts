import "dotenv/config";
import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().max(65_535).default(5000),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    CORS_ORIGINS: z
      .string()
      .min(1, "CORS_ORIGINS is required")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .refine((origins) => origins.length > 0, "At least one CORS origin is required"),
    SMTP_HOST: optionalString,
    SMTP_PORT: z.coerce.number().int().positive().max(65_535).default(587),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    MAIL_FROM: optionalString,
    CONTACT_EMAIL: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.email().optional(),
    ),
    TURNSTILE_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    TURNSTILE_SECRET_KEY: optionalString,
    TURNSTILE_HOSTNAMES: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((hostname) => hostname.trim().toLowerCase())
          .filter(Boolean),
      ),
  })
  .superRefine(
    (
      {
        NODE_ENV,
        CORS_ORIGINS,
        SMTP_USER,
        SMTP_PASS,
        TURNSTILE_ENABLED,
        TURNSTILE_HOSTNAMES,
      },
      context,
    ) => {
    if (NODE_ENV === "production" && CORS_ORIGINS.includes("*")) {
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "Wildcard CORS origins are not allowed in production",
      });
    }

    if ((SMTP_USER && !SMTP_PASS) || (!SMTP_USER && SMTP_PASS)) {
      context.addIssue({
        code: "custom",
        path: [SMTP_USER ? "SMTP_PASS" : "SMTP_USER"],
        message: "SMTP_USER and SMTP_PASS must be provided together",
      });
    }

      if (NODE_ENV === "production" && !TURNSTILE_ENABLED) {
        context.addIssue({
          code: "custom",
          path: ["TURNSTILE_ENABLED"],
          message: "Turnstile cannot be disabled in production",
        });
      }

      if (TURNSTILE_ENABLED && TURNSTILE_HOSTNAMES.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["TURNSTILE_HOSTNAMES"],
          message: "At least one Turnstile hostname is required when verification is enabled",
        });
      }
    },
  );

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:", z.prettifyError(result.error));
  throw new Error("Environment validation failed");
}

export const env = result.data;
