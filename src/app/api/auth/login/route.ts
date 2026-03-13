import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { applyAuthRateLimit } from "@/lib/rate-limit/index";
import { loginSchema } from "@/lib/validation/auth";
import { writeAuditLog } from "@/lib/utils/audit";
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return apiError("Invalid email or password.", 401);
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return apiError("Invalid email or password.", 401);
    }

    if (!user.emailVerified) {
      return apiError("Please verify your email before signing in.", 403, {
        error: "EMAIL_NOT_VERIFIED",
      });
    }

    const userAgent = request.headers.get("user-agent") ?? undefined;
    await createSession(user.id, { ipAddress: ip, userAgent });

    await writeAuditLog({
      userId: user.id,
      action: "LOGIN",
      resource: "user",
      resourceId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
