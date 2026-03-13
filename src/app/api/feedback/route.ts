import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { applyFeedbackRateLimit } from "@/lib/rate-limit/index";
import { feedbackSchema } from "@/lib/validation/feedback";
import { isRateLimitingEnabled } from "@/lib/feature-flags";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const session = await getSession();

    if (session) {
      const rateLimitingEnabled = await isRateLimitingEnabled();
      if (rateLimitingEnabled) {
        const rateLimit = await applyFeedbackRateLimit(session.user.id);
        if (!rateLimit.allowed) {
          return apiError("Too many requests. Please try again later.", 429, {
            retryAfter: Math.ceil(
              (rateLimit.resetAt.getTime() - Date.now()) / 1000
            ),
          });
        }
      }
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { executionId, conversationId, messageId, comment, rating, email } =
      parsed.data;

    const ip = getClientIp(request);

    const feedback = await db.feedback.create({
      data: {
        userId: session?.user.id ?? null,
        executionId,
        conversationId: conversationId ?? null,
        messageId: messageId ?? null,
        comment,
        rating: rating ?? null,
        email: email && email.length > 0 ? email : null,
        ipAddress: ip,
        flagged: false,
        reviewed: false,
      },
      select: { id: true },
    });

    return apiSuccess({ id: feedback.id }, 201);
  } catch (err) {
    console.error("[feedback POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
