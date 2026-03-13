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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
    );

    const resolvedParam = searchParams.get("resolved");
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (resolvedParam !== null) {
      where["resolved"] = resolvedParam === "true";
    }
    if (severity) {
      where["severity"] = severity;
    }
    if (type) {
      where["type"] = type;
    }

    const [incidents, total] = await Promise.all([
      db.incident.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          severity: true,
          description: true,
          userId: true,
          executionId: true,
          requestId: true,
          resolved: true,
          resolvedBy: true,
          resolvedAt: true,
          metadata: true,
          createdAt: true,
        },
      }),
      db.incident.count({ where }),
    ]);

    return apiSuccess({ incidents, total, page, pageSize: limit });
  } catch (err) {
    console.error("[admin/incidents GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
