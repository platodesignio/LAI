import { type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, destroySession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/utils/request";

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
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

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        'Please confirm account deletion by sending {"confirmation":"DELETE"}.',
        400
      );
    }

    // Delete user — Prisma cascade will handle sessions, conversations, etc.
    await db.user.delete({
      where: { id: session.user.id },
    });

    await destroySession();

    return apiSuccess({ message: "Account deleted." });
  } catch (err) {
    console.error("[delete-account]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
