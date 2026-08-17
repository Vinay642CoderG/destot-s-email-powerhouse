import { Router } from "express";
import { z } from "zod";

import { contactSchema } from "../schemas/contact.schema.js";
import { sendContactEmail } from "../utils/sendContactEmail.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyTurnstile } from "../utils/verifyTurnstile.js";

export const apiRouter = Router();

apiRouter.get("/", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "API v1 is running",
  });
});

apiRouter.post("/contact", async (request, response, next) => {
  const result = contactSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      success: false,
      message: "Invalid contact form data",
      errors: z.flattenError(result.error).fieldErrors,
    });
    return;
  }

  try {
    const isHuman = await verifyTurnstile(result.data.turnstileToken, request.ip);

    if (!isHuman) {
      throw new ApiError(400, "Bot verification failed");
    }

    await sendContactEmail(result.data);

    response.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    next(error);
  }
});
