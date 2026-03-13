import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updateFeatureFlagSchema } from "@/lib/validation/admin";
import { writeAuditLog } from "@/lib/utils/audit";
import { invalidateFeatureFlagCache } from "@/lib/feature-flags";
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

    const existing = await db.featureFlag.findUnique({
      where: { id },
      select: { id: true, key: true },
    });

    if (!existing) {
      return apiError("Feature flag not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updateFeatureFlagSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { enabled, description, metadata } = parsed.data;

    const updated = await db.featureFlag.update({
      where: { id },
      data: {
        enabled,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata: metadata as never } : {}),
      },
      select: {
        id: true,
        key: true,
        enabled: true,
        description: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    invalidateFeatureFlagCache();

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_UPDATE_FEATURE_FLAG",
      resource: "featureFlag",
      resourceId: id,
      metadata: { key: existing.key, changes: parsed.data },
      ipAddress: ip,
    });

    return apiSuccess({ flag: updated });
  } catch (err) {
    console.error("[admin/feature-flags/[id] PATCH]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function DELETE(
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

    const existing = await db.featureFlag.findUnique({
      where: { id },
      select: { id: true, key: true },
    });

    if (!existing) {
      return apiError("Feature flag not found.", 404);
    }

    await db.featureFlag.delete({ where: { id } });

    invalidateFeatureFlagCache();

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_DELETE_FEATURE_FLAG",
      resource: "featureFlag",
      resourceId: id,
      metadata: { key: existing.key },
      ipAddress: ip,
    });

    return apiSuccess({ message: "Feature flag deleted." });
  } catch (err) {
    console.error("[admin/feature-flags/[id] DELETE]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
