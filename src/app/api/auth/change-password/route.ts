import { type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireSession, invalidateAllUserSessions } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/utils/audit";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required.").max(128),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let session;
    try {
      session = await requireSession();
    } catch {
      return apiError("Not authenticated.", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return apiError("User not found.", 404);
    }

    const currentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );
    if (!currentPasswordValid) {
      return apiError("Current password is incorrect.", 400);
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    await invalidateAllUserSessions(user.id);

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await writeAuditLog({
      userId: user.id,
      action: "PASSWORD_CHANGED",
      resource: "user",
      resourceId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return apiSuccess({ message: "Password updated. Please sign in again." });
  } catch (err) {
    console.error("[change-password]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
