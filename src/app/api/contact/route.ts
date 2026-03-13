import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applyContactRateLimit } from "@/lib/rate-limit/index";
import { contactSchema } from "@/lib/validation/contact";
import { isRateLimitingEnabled } from "@/lib/feature-flags";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const ip = getClientIp(request);

    const rateLimitingEnabled = await isRateLimitingEnabled();
    if (rateLimitingEnabled) {
      const rateLimit = await applyContactRateLimit(ip);
      if (!rateLimit.allowed) {
        return apiError("Too many requests. Please try again later.", 429, {
          retryAfter: Math.ceil(
            (rateLimit.resetAt.getTime() - Date.now()) / 1000
          ),
        });
      }
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, subject, message } = parsed.data;

    await db.contactInquiry.create({
      data: {
        name,
        email,
        subject,
        message,
        ipAddress: ip,
      },
    });

    return apiSuccess({ message: "Message received." });
  } catch (err) {
    console.error("[contact POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
