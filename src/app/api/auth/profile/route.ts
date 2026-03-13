import { type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/utils/request";

const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
});

export async function PATCH(request: NextRequest): Promise<Response> {
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

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { name } = parsed.data;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return apiSuccess({ user: updatedUser });
  } catch (err) {
    console.error("[profile PATCH]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
