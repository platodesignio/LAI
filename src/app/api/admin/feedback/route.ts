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

    const flaggedParam = searchParams.get("flagged");
    const reviewedParam = searchParams.get("reviewed");

    const where: Record<string, unknown> = {};
    if (flaggedParam !== null) {
      where["flagged"] = flaggedParam === "true";
    }
    if (reviewedParam !== null) {
      where["reviewed"] = reviewedParam === "true";
    }

    const [feedbackList, total] = await Promise.all([
      db.feedback.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          executionId: true,
          conversationId: true,
          messageId: true,
          comment: true,
          rating: true,
          email: true,
          flagged: true,
          reviewed: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          message: {
            select: {
              id: true,
              content: true,
              role: true,
            },
          },
        },
      }),
      db.feedback.count({ where }),
    ]);

    return apiSuccess({ feedback: feedbackList, total, page, pageSize: limit });
  } catch (err) {
    console.error("[admin/feedback GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
