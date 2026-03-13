import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { createPromptVersionSchema } from "@/lib/validation/admin";
import { writeAuditLog } from "@/lib/utils/audit";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    try {
      await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const versions = await db.promptVersion.findMany({
      orderBy: [{ mode: "asc" }, { version: "desc" }],
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

    // Group by mode
    const grouped: Record<string, typeof versions> = {};
    for (const v of versions) {
      const key = v.mode as string;
      if (!grouped[key]) grouped[key] = [];
      grouped[key]!.push(v);
    }

    return apiSuccess({ promptVersions: grouped });
  } catch (err) {
    console.error("[admin/prompt-policies GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let adminSession;
    try {
      adminSession = await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const parsed = createPromptVersionSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { mode, systemPrompt, notes, activate } = parsed.data;

    // Find the current max version for this mode
    const maxVersionRecord = await db.promptVersion.findFirst({
      where: { mode },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (maxVersionRecord?.version ?? 0) + 1;

    let promptVersion;

    if (activate) {
      // Deactivate all existing versions for this mode, then create the new active one
      await db.promptVersion.updateMany({
        where: { mode, isActive: true },
        data: { isActive: false },
      });

      promptVersion = await db.promptVersion.create({
        data: {
          mode,
          version: nextVersion,
          systemPrompt,
          notes: notes ?? null,
          isActive: true,
        },
        select: {
          id: true,
          mode: true,
          version: true,
          systemPrompt: true,
          notes: true,
          isActive: true,
          createdAt: true,
        },
      });
    } else {
      promptVersion = await db.promptVersion.create({
        data: {
          mode,
          version: nextVersion,
          systemPrompt,
          notes: notes ?? null,
          isActive: false,
        },
        select: {
          id: true,
          mode: true,
          version: true,
          systemPrompt: true,
          notes: true,
          isActive: true,
          createdAt: true,
        },
      });
    }

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_CREATE_PROMPT_VERSION",
      resource: "promptVersion",
      resourceId: promptVersion.id,
      metadata: { mode, version: nextVersion, activate },
      ipAddress: ip,
    });

    return apiSuccess({ promptVersion }, 201);
  } catch (err) {
    console.error("[admin/prompt-policies POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
