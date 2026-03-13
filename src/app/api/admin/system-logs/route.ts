import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/utils/request";

export async function GET(request: NextRequest): Promise<Response> {
  try {
    try {
      await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") ?? undefined;
    const resource = searchParams.get("resource") ?? undefined;

    const where: Record<string, unknown> = {};
    if (action) {
      where["action"] = action;
    }
    if (resource) {
      where["resource"] = resource;
    }

    const logs = await db.auditLog.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return apiSuccess({ logs });
  } catch (err) {
    console.error("[admin/system-logs GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
