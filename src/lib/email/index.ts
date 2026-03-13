import nodemailer from "nodemailer";
import { logger } from "@/lib/utils/logger";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env["SMTP_HOST"],
    port: parseInt(process.env["SMTP_PORT"] ?? "587", 10),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASSWORD"],
    },
  });

  return transporter;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const transport = getTransporter();
    const from = process.env["SMTP_FROM"] ?? "Laozi AI <noreply@laozi.ai>";

    await transport.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    logger.info("Email sent", { to: payload.to, subject: payload.subject });
    return true;
  } catch (err) {
    logger.error("Failed to send email", {
      to: payload.to,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
