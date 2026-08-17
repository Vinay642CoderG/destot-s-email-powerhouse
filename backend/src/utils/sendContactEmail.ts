import nodemailer from "nodemailer";

import { env } from "../config/env.js";
import type { ContactPayload } from "../schemas/contact.schema.js";
import { ApiError } from "./ApiError.js";

export async function sendContactEmail(contact: ContactPayload): Promise<void> {
  if (!env.SMTP_HOST || !env.MAIL_FROM || !env.CONTACT_EMAIL) {
    throw new ApiError(503, "Email service is not configured");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),
  });

  const message = [
    "New contact form submission",
    "",
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Company: ${contact.company}`,
    `Phone: ${contact.phone || "Not provided"}`,
    `Service: ${contact.service}`,
    `Monthly volume: ${contact.volume}`,
    "",
    "Message:",
    contact.message,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: env.CONTACT_EMAIL,
      replyTo: contact.email,
      subject: "New contact enquiry from the Destot website",
      text: message,
    });
  } catch (error) {
    console.error("Failed to send contact email:", error);
    throw new ApiError(502, "Unable to send message right now");
  }
}
