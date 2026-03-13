import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { reviewFeedbackSchema } from "@/lib/validation/admin";
import { writeAuditLog } from "@/lib/utils/audit";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    let adminSession;
    try {
      adminSession = await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const { id } = await params;

    const existing = await db.feedback.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Feedback not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = reviewFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { reviewed, flagged } = parsed.data;

    const updated = await db.feedback.update({
      where: { id },
      data: {
        reviewed,
        ...(flagged !== undefined ? { flagged } : {}),
      },
      select: {
        id: true,
        reviewed: true,
        flagged: true,
        updatedAt: true,
      },
    });

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_REVIEW_FEEDBACK",
      resource: "feedback",
      resourceId: id,
      metadata: { reviewed, flagged },
      ipAddress: ip,
    });

    return apiSuccess({ feedback: updated });
  } catch (err) {
    console.error("[admin/feedback/[id] PATCH]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
