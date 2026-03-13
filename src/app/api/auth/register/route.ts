import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { generateTokenWithExpiry } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/index";
import { verificationEmailTemplate } from "@/lib/email/templates";
import { applyAuthRateLimit } from "@/lib/rate-limit/index";
import { registerSchema } from "@/lib/validation/auth";
import { isRegistrationEnabled } from "@/lib/feature-flags";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

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

    const registrationEnabled = await isRegistrationEnabled();
    if (!registrationEnabled) {
      return apiError("Registration is currently disabled.", 503);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password, name } = parsed.data;

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return apiError("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(password);
    const { token, expiry } = generateTokenWithExpiry(32, 86400);

    await db.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name ?? null,
        verificationToken: token,
        verificationExpiry: expiry,
        emailVerified: null,
      },
    });

    const template = verificationEmailTemplate(token);
    await sendEmail({ to: email, ...template });

    return apiSuccess(
      { message: "Account created. Check your email to verify." },
      201
    );
  } catch (err) {
    console.error("[register]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
