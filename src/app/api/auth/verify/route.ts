import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyEmailSchema } from "@/lib/validation/auth";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { token } = parsed.data;

    const user = await db.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpiry: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return apiError("Invalid or expired verification token.", 400);
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    return apiSuccess({ message: "Email verified." });
  } catch (err) {
    console.error("[verify]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
