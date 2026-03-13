import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/utils/request";

interface MessagesPerDayRow {
  date: Date | string;
  count: bigint | number;
}

interface ModelUsageRow {
  modelProvider: string | null;
  count: bigint | number;
}

export async function GET(): Promise<Response> {
  try {
    try {
      await requireAdmin();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "UNAUTHENTICATED") return apiError("Not authenticated.", 401);
      return apiError("Forbidden.", 403);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      messagesPerDayRaw,
      conversationsPerMode,
      feedbackRatingDist,
      activeUsersCount,
      modelUsageRaw,
      totalUsers,
      totalConversations,
      totalMessages,
      totalFeedback,
    ] = await Promise.all([
      // Messages per day — last 14 days via raw SQL
      db.$queryRaw<MessagesPerDayRow[]>`
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM "Message"
        WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,

      // Conversations grouped by mode
      db.conversation.groupBy({
        by: ["mode"],
        _count: { _all: true },
      }),

      // Feedback rating distribution
      db.feedback.groupBy({
        by: ["rating"],
        _count: { _all: true },
        where: { rating: { not: null } },
      }),

      // Active users: users with at least one conversation in last 7 days
      db.user.count({
        where: {
          conversations: {
            some: {
              updatedAt: { gte: sevenDaysAgo },
            },
          },
        },
      }),

      // Model usage: count messages by modelProvider via raw SQL for efficiency
      db.$queryRaw<ModelUsageRow[]>`
        SELECT "modelProvider", COUNT(*) AS count
        FROM "Message"
        WHERE "modelProvider" IS NOT NULL
        GROUP BY "modelProvider"
        ORDER BY count DESC
      `,

      // Total counts
      db.user.count(),
      db.conversation.count(),
      db.message.count(),
      db.feedback.count(),
    ]);

    // Normalize BigInt values from raw queries
    const messagesPerDay = messagesPerDayRaw.map((row) => ({
      date:
        row.date instanceof Date
          ? row.date.toISOString().split("T")[0]
          : String(row.date),
      count: typeof row.count === "bigint" ? Number(row.count) : row.count,
    }));

    const modelUsage = modelUsageRaw.map((row) => ({
      provider: row.modelProvider ?? "unknown",
      count: typeof row.count === "bigint" ? Number(row.count) : row.count,
    }));

    const conversationsPerModeNormalized = conversationsPerMode.map((item) => ({
      mode: item.mode,
      count: item._count._all,
    }));

    const feedbackRatingDistNormalized = feedbackRatingDist.map((item) => ({
      rating: item.rating,
      count: item._count._all,
    }));

    return apiSuccess({
      messagesPerDay,
      conversationsPerMode: conversationsPerModeNormalized,
      feedbackRatingDist: feedbackRatingDistNormalized,
      activeUsers: activeUsersCount,
      modelUsage,
      totalStats: {
        users: totalUsers,
        conversations: totalConversations,
        messages: totalMessages,
        feedback: totalFeedback,
      },
    });
  } catch (err) {
    console.error("[admin/analytics GET]", err);
    return apiError("An unexpected error occurred.", 500);
  }
}
