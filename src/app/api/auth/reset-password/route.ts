import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { invalidateAllUserSessions } from "@/lib/auth/session";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { writeAuditLog } from "@/lib/utils/audit";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { token, password } = parsed.data;

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return apiError("Invalid or expired reset token.", 400);
    }

    const passwordHash = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    await invalidateAllUserSessions(user.id);

    await writeAuditLog({
      userId: user.id,
      action: "PASSWORD_RESET",
      resource: "user",
      resourceId: user.id,
    });

    return apiSuccess({
      message: "Password reset successfully. Please sign in.",
    });
  } catch (err) {
    console.error("[reset-password]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
