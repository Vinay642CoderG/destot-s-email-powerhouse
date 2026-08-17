import { z } from "zod";

import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";

const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const expectedAction = "contact";

export async function verifyTurnstile(token?: string, clientIp?: string): Promise<boolean> {
  if (!env.TURNSTILE_ENABLED) {
    return true;
  }

  if (!token) {
    return false;
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    throw new ApiError(503, "Bot verification is not configured");
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (clientIp) {
    body.set("remoteip", clientIp);
  }

  try {
    const response = await fetch(siteverifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Siteverify returned HTTP ${response.status}`);
    }

    const result = siteverifyResponseSchema.safeParse(await response.json());

    if (!result.success) {
      throw new Error("Cloudflare Siteverify returned an invalid response");
    }

    const hostname = result.data.hostname?.toLowerCase();
    const isValid =
      result.data.success &&
      result.data.action === expectedAction &&
      hostname !== undefined &&
      env.TURNSTILE_HOSTNAMES.includes(hostname);

    if (!isValid) {
      console.warn("Turnstile verification rejected:", {
        errorCodes: result.data["error-codes"] ?? [],
        hostname: result.data.hostname,
        action: result.data.action,
      });
    }

    return isValid;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error("Turnstile verification request failed:", error);
    throw new ApiError(502, "Bot verification is temporarily unavailable");
  }
}
