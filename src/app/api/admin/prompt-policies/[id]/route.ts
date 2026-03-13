import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updatePromptVersionSchema } from "@/lib/validation/admin";
import { writeAuditLog } from "@/lib/utils/audit";
import { invalidateFeatureFlagCache } from "@/lib/feature-flags";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    try {
      await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const { id } = await params;

    const promptVersion = await db.promptVersion.findUnique({
      where: { id },
      select: {
        id: true,
        mode: true,
        version: true,
        systemPrompt: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!promptVersion) {
      return apiError("Prompt version not found.", 404);
    }

    return apiSuccess({ promptVersion });
  } catch (err) {
    console.error("[admin/prompt-policies/[id] GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

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

    const existing = await db.promptVersion.findUnique({
      where: { id },
      select: { id: true, mode: true },
    });

    if (!existing) {
      return apiError("Prompt version not found.", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = updatePromptVersionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { systemPrompt, notes, isActive } = parsed.data;

    if (isActive === true) {
      // Deactivate all other versions for the same mode
      await db.promptVersion.updateMany({
        where: { mode: existing.mode, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await db.promptVersion.update({
      where: { id },
      data: {
        ...(systemPrompt !== undefined ? { systemPrompt } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        mode: true,
        version: true,
        systemPrompt: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Invalidate feature flag cache as provider settings may have changed
    invalidateFeatureFlagCache();

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_UPDATE_PROMPT_VERSION",
      resource: "promptVersion",
      resourceId: id,
      metadata: { changes: parsed.data },
      ipAddress: ip,
    });

    return apiSuccess({ promptVersion: updated });
  } catch (err) {
    console.error("[admin/prompt-policies/[id] PATCH]", err);
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

    const existing = await db.promptVersion.findUnique({
      where: { id },
      select: { id: true, mode: true, version: true, isActive: true },
    });

    if (!existing) {
      return apiError("Prompt version not found.", 404);
    }

    await db.promptVersion.delete({ where: { id } });

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_DELETE_PROMPT_VERSION",
      resource: "promptVersion",
      resourceId: id,
      metadata: { mode: existing.mode, version: existing.version },
      ipAddress: ip,
    });

    return apiSuccess({ message: "Prompt version deleted." });
  } catch (err) {
    console.error("[admin/prompt-policies/[id] DELETE]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
