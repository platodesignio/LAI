import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { resolveIncidentSchema } from "@/lib/validation/admin";
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

    const existing = await db.incident.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return apiError("Incident not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = resolveIncidentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { resolved, resolvedBy } = parsed.data;

    const updated = await db.incident.update({
      where: { id },
      data: {
        resolved,
        resolvedBy: resolved
          ? (resolvedBy ?? adminSession.user.email)
          : null,
        resolvedAt: resolved ? new Date() : null,
      },
      select: {
        id: true,
        type: true,
        severity: true,
        resolved: true,
        resolvedBy: true,
        resolvedAt: true,
        createdAt: true,
      },
    });

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_RESOLVE_INCIDENT",
      resource: "incident",
      resourceId: id,
      metadata: { resolved, resolvedBy },
      ipAddress: ip,
    });

    return apiSuccess({ incident: updated });
  } catch (err) {
    console.error("[admin/incidents/[id] PATCH]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
