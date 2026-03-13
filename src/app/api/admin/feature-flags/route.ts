import { type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/utils/audit";
import { invalidateFeatureFlagCache } from "@/lib/feature-flags";
import { getClientIp, apiError, apiSuccess } from "@/lib/utils/request";

const createFeatureFlagSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required.")
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores."),
  enabled: z.boolean(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    try {
      await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const flags = await db.featureFlag.findMany({
      orderBy: { key: "asc" },
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

    return apiSuccess({ flags });
  } catch (err) {
    console.error("[admin/feature-flags GET]", err);
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

    const parsed = createFeatureFlagSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed.", 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { key, enabled, description, metadata } = parsed.data;

    // Check for duplicate key
    const existing = await db.featureFlag.findUnique({
      where: { key },
      select: { id: true },
    });
    if (existing) {
      return apiError("A feature flag with this key already exists.", 409);
    }

    const flag = await db.featureFlag.create({
      data: {
        key,
        enabled,
        description: description ?? null,
        metadata: metadata as never ?? null,
      },
      select: {
        id: true,
        key: true,
        enabled: true,
        description: true,
        metadata: true,
        createdAt: true,
      },
    });

    invalidateFeatureFlagCache();

    const ip = getClientIp(request);
    await writeAuditLog({
      userId: adminSession.user.id,
      action: "ADMIN_CREATE_FEATURE_FLAG",
      resource: "featureFlag",
      resourceId: flag.id,
      metadata: { key, enabled },
      ipAddress: ip,
    });

    return apiSuccess({ flag }, 201);
  } catch (err) {
    console.error("[admin/feature-flags POST]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
