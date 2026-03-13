import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateTokenWithExpiry } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/index";
import { passwordResetEmailTemplate } from "@/lib/email/templates";
import { applyAuthRateLimit } from "@/lib/rate-limit/index";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

const SILENT_RESPONSE = {
  message:
    "If an account exists with this email, a reset link has been sent.",
};

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(request);

    const rateLimit = await applyAuthRateLimit(ip);
    if (!rateLimit.allowed) {
      return apiError("Too many requests. Please try again later.", 429, {
        retryAfter: Math.ceil(
          (rateLimit.resetAt.getTime() - Date.now()) / 1000
        ),
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { email } = parsed.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (!user) {
      // Silently succeed to prevent enumeration
      return apiSuccess(SILENT_RESPONSE);
    }

    const { token, expiry } = generateTokenWithExpiry(32, 3600);

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const template = passwordResetEmailTemplate(token);
    await sendEmail({ to: user.email, ...template });

    return apiSuccess(SILENT_RESPONSE);
  } catch (err) {
    console.error("[forgot-password]", err);
    // Always return the same message to prevent enumeration
    return apiSuccess(SILENT_RESPONSE);
  }
}
